"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/@core/contexts/AuthContext";
import { useTranslation } from "@/@core/hooks/useTranslation";
import { SuggestionInputMulti } from "./components/SuggestionInputMulti";
import StartScreen from "@/views/try-on/components/StartScreen";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { workshopService } from "@/services/workshop.service";
import { userService } from "@/services/user.service";
import type { ModelUserResponse } from "@/services/user.types";
import { fileToDataUrl, toDataUrl } from "@/views/try-on/utils/imageUtils";
import { useSuggestMulti } from "./hooks/useSuggestMulti";
import type { SuggestTask, StylingOption } from "./hooks/useSuggestMulti";
import { SuggestionHistorySidebar } from "./components/SuggestionHistorySidebar";
import type { HistoryEntry } from "./components/SuggestionHistorySidebar";
import { outfitSuggestService, type OutfitSuggestionHistory } from "@/services/outfit-suggest.service";
import { showErrorToast } from "@/services/toast.service";
import { ClientApi } from "@/services/client-api.service";

const DAILY_LIMITS = {
  MODEL_PICTURES: 40,
};

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

const canGenerateModel = (
  modelUserData: ModelUserResponse | null
): { canGenerate: boolean; remaining: number; message: string } => {
  const used = modelUserData?.todayModelPictureCreatedCount || 0;
  const limit = DAILY_LIMITS.MODEL_PICTURES;
  const remaining = Math.max(0, limit - used);

  if (used >= limit) {
    return {
      canGenerate: false,
      remaining: 0,
      message: `Daily model limit reached (${limit}/${limit}). Try again tomorrow!`,
    };
  }

  return { canGenerate: true, remaining, message: `${remaining} of ${limit} attempts remaining` };
};

const OutfitSuggestView = () => {
  const { setUser, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [modelUserData, setModelUserData] = useState<ModelUserResponse | null>(null);
  const [isLoadingModelUser, setIsLoadingModelUser] = useState(true);
  const [userProfile, setUserProfile] = useState<{ maxImageGeneratePerDay?: number } | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [historyEntries, setHistoryEntries] = useState<OutfitSuggestionHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<SuggestTask | null>(null);
  const [userModels, setUserModels] = useState<{ defaultModelName?: string | null; modelUrls?: string[] | null } | null>(null);
  const [isLoadingUserModels, setIsLoadingUserModels] = useState(true);
  const [showStartScreen, setShowStartScreen] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteModel, setPendingDeleteModel] = useState<{ url: string; fileName: string } | null>(null);

  const resolveImageUrl = useCallback(async (imageName?: string | null) => {
    if (!imageName) return null;
    if (imageName.startsWith("http") || imageName.startsWith("data:")) return imageName;

    try {
      const url = await outfitSuggestService.getPresignedUrl(imageName);
      return url || null;
    } catch (err) {
      //error("Failed to resolve presigned URL for history image:", err);
      return null;
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history = await outfitSuggestService.getHistory(100);
      
      const hydratedHistory = await Promise.all(
        (history ?? []).map(async (entry) => {
          // Hydrate options with pre-signed URLs
          const hydratedOptions = await Promise.all(
            (entry.options ?? []).map(async (opt) => ({
              ...opt,
              generatedImageUrl: opt.generatedImageUrl 
                ? (await resolveImageUrl(opt.generatedImageUrl)) || null 
                : null
            }))
          );

          // Derive generatedImages from hydrated options
          const generatedImages = hydratedOptions
            .map(opt => opt.generatedImageUrl)
            .filter(Boolean) as string[];

          const previewSource = entry.previewImageUrl 
            ?? hydratedOptions?.[0]?.generatedImageUrl 
            ?? null;
          const previewImageUrl = previewSource ? await resolveImageUrl(previewSource) : null;
          
          // Hydrate model image URL
          const modelImageUrl = entry.modelImageUrl 
            ? await resolveImageUrl(entry.modelImageUrl) 
            : null;

          return {
            ...entry,
            options: hydratedOptions,
            generatedImages: generatedImages.filter(Boolean) as string[],
            previewImageUrl,
            modelImageUrl,
          };
        })
      );

      setHistoryEntries(hydratedHistory);
    } catch (err: any) {
      showErrorToast(err?.message || t("outfitSuggest.errors.failedLoadHistory"));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [resolveImageUrl]);

  const suggest = useSuggestMulti({ onHistorySaved: loadHistory });
  const { tasks, handleSend, handleRegenerate, clearTasks } = suggest;
  const displayedTasks = selectedHistoryTask ? [selectedHistoryTask] : tasks;

  const handleDeleteHistoryEntry = useCallback(
    async (entry: HistoryEntry) => {
      const targetId = entry.historyId ?? entry.id;
      const isPersisted = Boolean(entry.createdAt || entry.historyId);

      if (!isPersisted || targetId === undefined || targetId === null) {
        return;
      }

      try {
        await outfitSuggestService.deleteHistory(targetId);
        setHistoryEntries((prev) => prev.filter((h) => h.id !== Number(targetId)));

        if (selectedHistoryTask?.id === targetId.toString()) {
          setSelectedHistoryTask(null);
          clearTasks();
        }
      } catch (err: any) {
        // console.error("Failed to delete history entry:", err);
        showErrorToast(err?.message || "Failed to delete history");
      }
    },
    [selectedHistoryTask, clearTasks]
  );

  const handleClearHistory = useCallback(async () => {
    try {
      await outfitSuggestService.clearHistory();
      setHistoryEntries([]);
      setSelectedHistoryTask(null);
      clearTasks();
    } catch (err: any) {
      //console.error("Failed to clear history:", err);
      showErrorToast(err?.message || "Failed to clear history");
    }
  }, [clearTasks]);

  const ensureToken = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      throw new Error(t("outfitSuggest.errors.loginRequired"));
    }
    return token;
  }, [t]);

  const persistModelPicture = useCallback(
    async (imageDataUrl: string) => {
      // Save to backend and refresh profile
      const response = await workshopService.saveModelPicture({ ImageBase64: imageDataUrl });
      
      const profile = await userService.getUserProfileFromBackend();

      // Note: User info is now fetched fresh from backend instead of from localStorage
      // The auth context will handle updating the user state through the token
    },
    []
  );

  const handleModelFinalized = useCallback(
    async (
      modelUrl: string,
      options?: { base64Data?: string; persist?: boolean; fileName?: string; originalFile?: File }
    ) => {
      const { base64Data, persist = false } = options || {};
      setModelImageUrl(modelUrl);
      setIsRestarting(false);

      if (persist) {
        const dataToSave = base64Data ?? modelUrl;
        await persistModelPicture(dataToSave);
      }
    },
    [persistModelPicture]
  );

  const handleStartNewChat = useCallback(() => {
    setSelectedHistoryTask(null);
    clearTasks();
  }, [clearTasks]);

  const handleAddModelFromPanel = useCallback(() => {
    setShowStartScreen(true);
  }, []);

  const fetchUserModels = useCallback(async () => {
    try {
      const data = await outfitSuggestService.getModelUser();
      setUserModels(data);
    } catch (err) {
      // console.error("Failed to fetch user models:", err);
      showErrorToast(t("outfitSuggest.errors.failedLoadModels"));
    } finally {
      setIsLoadingUserModels(false);
    }
  }, [t]);

  const handleDeleteModel = useCallback((url: string) => {
    // Extract filename from URL
    const match = url.match(/\/([^\/\?]+\.(jpg|jpeg|png|gif|webp|bmp))(?:\?|$)/i);
    const fileName = match ? match[1] : null;

    if (!fileName) {
      showErrorToast("Invalid model URL");
      return;
    }

    // Check if this is the default model
    const isDefault = fileName === userModels?.defaultModelName;

    if (isDefault) {
      // Show warning that default model cannot be deleted
      setShowDeleteWarning(true);
      return;
    }

    // Show confirmation dialog for non-default models
    setPendingDeleteModel({ url, fileName });
    setShowDeleteConfirm(true);
  }, [userModels?.defaultModelName]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteModel) return;

    try {
      await workshopService.deleteModelPicture(pendingDeleteModel.fileName);
      
      // Refresh models list
      await fetchUserModels();
      
      // If the deleted model was currently selected, clear it
      if (modelImageUrl === pendingDeleteModel.url) {
        setModelImageUrl(null);
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Failed to delete model");
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteModel(null);
    }
  }, [pendingDeleteModel, fetchUserModels, modelImageUrl]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setPendingDeleteModel(null);
  }, []);

  const fetchOutfitItemData = useCallback(async (outfitItemIds?: number[][]) => {
    if (!outfitItemIds || !outfitItemIds.length) {
      return { images: [], names: [], categories: [] };
    }

    const allIds = Array.from(
      new Set(
        outfitItemIds
          .flat()
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      )
    );

    const cache = new Map<number, { imageUrl: string; name?: string; category?: string | null }>();

    await Promise.all(
      allIds.map(async (id) => {
        try {
          const itemRes = await ClientApi.get<{ 
            imageUrl?: string; 
            comment?: string;
            categoryName?: string;
          }>(`/Item/${id}`);
          const raw = itemRes.getRaw()?.data ?? {};
          cache.set(id, { 
            imageUrl: raw.imageUrl || "", 
            name: raw.comment?.trim() || undefined, 
            category: raw.categoryName?.trim() || null 
          });
        } catch (err) {
          // console.error("Failed to fetch item data for id", id, err);
          cache.set(id, { imageUrl: "", name: undefined, category: null });
        }
      })
    );

    const images = outfitItemIds.map((set) => set.map((id) => cache.get(Number(id))?.imageUrl || ""));
    const names = outfitItemIds.map((set) =>
      set.map((id, idx) => cache.get(Number(id))?.name || `Item ${idx + 1}`)
    );
    const categories = outfitItemIds.map((set) =>
      set.map((id) => cache.get(Number(id))?.category ?? null)
    );

    return { images, names, categories };
  }, []);

  const handleSelectHistoryEntry = useCallback(
    async (entry: HistoryEntry) => {
      const filteredImages = (entry.generatedImages ?? []).filter(Boolean) as string[];
      const hydratedImages = filteredImages.length
        ? filteredImages
        : entry.preview
          ? [entry.preview]
          : [];

      // Fetch item data (names, categories, images) from backend
      // Build itemIds array from entry.options or entry.outfitItemIds
      const itemIdsFromOptions = entry.options?.map(opt => opt.itemIds || []) || [];
      const itemIdsToFetch = itemIdsFromOptions.length > 0 ? itemIdsFromOptions : entry.outfitItemIds;
      const { images: itemImages, names: fetchedNames, categories: fetchedCategories } = await fetchOutfitItemData(itemIdsToFetch);

      // Convert history format to options format
      // Priority: Use backend-provided Options, fallback to legacy fields
      const createOptionsFromHistory = (
        entry: HistoryEntry,
        images: string[],
        itemIds?: number[][],
        itemNames?: string[][],
        itemCategories?: (string | null)[][],
        itemImageUrls?: string[][]
      ): StylingOption[] => {
        // Use backend-provided options if available
        if (entry.options && entry.options.length > 0) {
          return entry.options.map((opt, idx) => ({
            id: `history-option-${idx}`,
            title: opt.title || `Style Option ${idx + 1}`,
            description: opt.description || (opt.isFromWardrobe ? "From your wardrobe" : "Creative alternative"),
            isFromWardrobe: opt.isFromWardrobe ?? true,
            optionIndex: idx, // Add for reactive translation
            selectedItemIds: opt.itemIds || [],
            outfitItems: (opt.itemIds || []).map((id, i) => ({
              id,
              name: itemNames?.[idx]?.[i] || `Item ${i + 1}`,
              category: itemCategories?.[idx]?.[i] || "N/A",
              imageUrl: itemImageUrls?.[idx]?.[i] || entry.outfitDetails?.[idx]?.[i] || "",
            })),
            generatedImage: opt.generatedImageUrl || images[idx] || null,
            isLoading: false,
            error: null,
          }));
        }

        // Fallback: Build options from legacy fields
        return images.slice(0, 3).map((img, idx) => ({
          id: `history-option-${idx}`,
          title: idx === 2 ? t("outfitSuggest.labels.creativeAlternative") : t("outfitSuggest.labels.styleOption", { index: idx + 1 }),
          description: idx === 2 
            ? t("outfitSuggest.messages.beyondWardrobe") 
            : t("outfitSuggest.messages.outfitCombination", { index: idx + 1 }),
          isFromWardrobe: idx !== 2,
          optionIndex: idx, // Add for reactive translation
          selectedItemIds: itemIds?.[idx] || [],
          outfitItems: (itemIds?.[idx] || []).map((id, i) => ({
            id,
            name: itemNames?.[idx]?.[i] || `Item ${i + 1}`,
            category: itemCategories?.[idx]?.[i] || "Unknown",
            imageUrl: itemImageUrls?.[idx]?.[i] || entry.outfitDetails?.[idx]?.[i] || "",
          })),
          generatedImage: img,
          isLoading: false,
          error: null,
        }));
      };

      const options = createOptionsFromHistory(
        entry,
        hydratedImages,
        itemIdsToFetch,
        fetchedNames,
        fetchedCategories,
        itemImages
      );

      // Ensure we always have 3 options
      while (options.length < 3) {
        options.push({
          id: `history-option-${options.length}`,
          title: `${t("outfitSuggest.labels.styleOption", { index: options.length + 1 })}`,
          description: t("outfitSuggest.labels.noImageGenerated"),
          isFromWardrobe: options.length !== 2,
          selectedItemIds: [],
          outfitItems: [],
          generatedImage: null,
          isLoading: false,
          error: null,
        });
      }

      setSelectedHistoryTask({
        id: entry.id.toString(),
        query: entry.queryText || entry.title || "Untitled",
        isLoading: false,
        statusLabel: entry.status || "Done",
        thinkingDots: "",
        showResults: true,
        options,
        activeOptionIndex: 0,
        modelImageUrl: entry.modelImageUrl || null,
        error: null,
      });
      clearTasks();
    },
    [clearTasks, fetchOutfitItemData]
  );

  const handleGenerateModel = useCallback(
    async (file: File) => {
      ensureToken();

      const limitCheck = canGenerateModel(modelUserData);
      
      if (!limitCheck.canGenerate) {
        throw new Error(limitCheck.message);
      }

      if (modelUserData) {
        setModelUserData({
          ...modelUserData,
          todayModelPictureCreatedCount:
            (modelUserData.todayModelPictureCreatedCount || 0) + 1,
        });
      }

      const imageDataUrl = await fileToDataUrl(file);

      try {
        const response = await workshopService.generateModelEnhancement({
          Images: [imageDataUrl],
        });

        return {
          displayUrl: response.imageUrl ?? toDataUrl(response.ImageBase64, response.mimeType),
          base64Data: response.ImageBase64,
          fileName: response.fileName,
        };
      } catch (err) {
        if (modelUserData) {
          setModelUserData({
            ...modelUserData,
            todayModelPictureCreatedCount: Math.max(
              0,
              (modelUserData.todayModelPictureCreatedCount || 1) - 1
            ),
          });
        }
        throw err;
      }
    },
    [ensureToken, modelUserData]
  );

  const fetchModelUserData = useCallback(async () => {
    try {
      const data = await userService.getModelUser();
      setModelUserData(data);
      
      // Fetch user profile to get actual max limits
      const profile = await userService.getUserProfileFromBackend();
      setUserProfile(profile);
    } catch (err) {
      // console.error("Failed to fetch model user data:", err);
    } finally {
      setIsLoadingModelUser(false);
    }
  }, []);

  const handleStartScreenModelFinalized = useCallback(
    async (
      modelUrl: string,
      options?: { base64Data?: string; persist?: boolean; fileName?: string; originalFile?: File }
    ) => {
      setShowStartScreen(false);
      setModelImageUrl(modelUrl);

      if (options?.fileName) {
        // Update the current model
        await handleModelFinalized(modelUrl, options);
      }

      // Refresh models list to include the new model
      await fetchUserModels();
    },
    [fetchUserModels, handleModelFinalized]
  );

  useEffect(() => {
    if (isAuthenticated && isLoadingModelUser) {
      void fetchModelUserData();
    }
  }, [isAuthenticated, isLoadingModelUser, fetchModelUserData]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadHistory();
      void fetchUserModels();
    }
  }, [isAuthenticated, loadHistory, fetchUserModels]);

  useEffect(() => {
    if (!modelImageUrl && modelUserData?.modelPictureUrls?.[0] && isAuthenticated) {
      void handleModelFinalized(modelUserData.modelPictureUrls[0], {
        persist: false,
        fileName: undefined,
      });
    }
  }, [modelImageUrl, modelUserData?.modelPictureUrls, isAuthenticated, handleModelFinalized]);

  const content = useMemo(() => {
    if (!modelImageUrl) {
      return (
        <StartScreen
          onModelFinalized={handleModelFinalized}
          onGenerateModel={handleGenerateModel}
          isAuthenticated={isAuthenticated}
          modelUserData={modelUserData}
          isRestarting={isRestarting}
        />
      );
    }

    return (
      <SuggestionInputMulti
        tasks={displayedTasks}
        handleSend={handleSend}
        handleRegenerate={handleRegenerate}
        clearTasks={handleStartNewChat}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        isHistoryOpen={isHistoryOpen}
        modelUrls={userModels?.modelUrls ?? []}
        modelImageUrl={modelImageUrl}
        isLoadingModels={isLoadingUserModels}
        defaultModelName={userModels?.defaultModelName ?? null}
        modelUserData={modelUserData}
        userProfile={userProfile}
        onAddModelFromPanel={handleAddModelFromPanel}
        onDeleteModel={handleDeleteModel}
        onModelSelect={async (url) => {
          // Extract filename from URL
          const match = url.match(/\/([^/\?]+\.(jpg|jpeg|png|gif|webp|bmp))(?:\?|$)/i);
          const fileName = match ? match[1] : null;
          
          if (!fileName) {
            // console.error("Failed to extract filename from URL:", url);
            showErrorToast("Invalid model URL");
            return;
          }

          try {
            await outfitSuggestService.setDefaultModel(fileName);
            // Refresh models list
            await fetchUserModels();
          } catch (err: any) {
            // console.error("Failed to set default model:", err);
            showErrorToast(err?.message || "Failed to set default model");
          }
        }}
      />
    );
  }, [
    modelImageUrl,
    handleGenerateModel,
    handleModelFinalized,
    isAuthenticated,
    modelUserData,
    isRestarting,
    displayedTasks,
    handleSend,
    handleRegenerate,
    handleStartNewChat,
  ]);

  return (
    <div className="relative flex min-h-full" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-1 flex-col">{content}</div>
      </div>

      <div className="relative">
        <SuggestionHistorySidebar
          tasks={tasks}
          historyEntries={historyEntries.map((h) => ({
            id: h.id,
            title: h.queryText,
            queryText: h.queryText,
            status: "Done",
            preview: h.previewImageUrl ?? h.options?.[0]?.generatedImageUrl ?? null,
            generatedImages: h.options?.map(opt => opt.generatedImageUrl).filter(Boolean) as string[],
            outfitItemIds: h.options?.map(opt => opt.itemIds) ?? [],
            outfitItemNames: h.outfitItemNames,
            outfitItemCategories: h.outfitItemCategories,
            modelImageUrl: h.modelImageUrl,
            createdAt: h.createdAt,
            options: h.options, // Pass backend-provided options
          }))}
          onClear={handleClearHistory}
          onDelete={handleDeleteHistoryEntry}
          onSelect={handleSelectHistoryEntry}
          isOpen={isHistoryOpen}
          onToggle={() => setIsHistoryOpen((prev) => !prev)}
        />
        
      </div>

      {/* StartScreen Modal - shown when "Add Model" is clicked */}
      <Dialog
        open={showStartScreen}
        onClose={() => setShowStartScreen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            overflow: "auto",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <StartScreen
            onModelFinalized={handleStartScreenModelFinalized}
            onGenerateModel={handleGenerateModel}
            isAuthenticated={isAuthenticated}
            modelUserData={modelUserData}
            isRestarting={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Warning Dialog - Cannot delete default model */}
      <Dialog
        open={showDeleteWarning}
        onClose={() => setShowDeleteWarning(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "warning.lighterOpacity",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="tabler-alert-triangle" style={{ fontSize: "2rem", color: "var(--mui-palette-warning-main)" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center" }}>
              {t("outfitSuggest.dialogs.cannotDeleteDefault")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              {t("outfitSuggest.dialogs.cannotDeleteDefaultDesc")}
            </Typography>
            <Button
              onClick={() => setShowDeleteWarning(false)}
              variant="contained"
              fullWidth
              sx={{ mt: 1 }}
            >
              {t("outfitSuggest.dialogs.understood")}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "error.lighterOpacity",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="tabler-trash" style={{ fontSize: "2rem", color: "var(--mui-palette-error-main)" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center" }}>
              {t("outfitSuggest.dialogs.deleteModel")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              {t("outfitSuggest.dialogs.deleteModelDesc")}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, width: "100%", mt: 1 }}>
              <Button
                onClick={handleCancelDelete}
                variant="outlined"
                fullWidth
              >
                {t("outfitSuggest.buttons.cancel")}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                color="error"
                fullWidth
              >
                {t("outfitSuggest.dialogs.deleteConfirm")}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OutfitSuggestView;
