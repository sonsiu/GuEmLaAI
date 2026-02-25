import { useEffect, useState } from "react";
import { ClientApi } from "@/services/client-api.service";
import { showErrorToast } from "@/services/toast.service";
import { useAuth } from "@/@core/contexts/AuthContext";
import { outfitSuggestService, StylingOptionRequest } from "@/services/outfit-suggest.service";
import { useTranslation } from "@/@core/hooks/useTranslation";

const extractFileNameFromUrl = (input?: string | null): string | null => {
  if (!input) return null;
  try {
    const url = new URL(input);
    const nameWithParams = url.pathname.split("/").pop() || "";
    return nameWithParams.split("?")[0] || null;
  } catch {
    if (input.startsWith("data:")) return null;
    const parts = input.split("/");
    const last = parts.pop();
    return last?.split("?")[0] || input;
  }
};

const GENERATION_MESSAGES = [
  "Rendering your outfits - this can take a minute, please keep this tab open.",
  "Generating try-on images, hang tight for 30-90 seconds.",
  "Putting the looks together... thanks for waiting a bit.",
  "Styling and rendering now. It may take a minute or so.",
];

const pickGenerationMessage = () =>
  GENERATION_MESSAGES[Math.floor(Math.random() * GENERATION_MESSAGES.length)];

const GUARDRAIL_PATTERNS = [
  "i don't have an answer for this question. please ask questions about outfit suggestion.",
  "please provide a more detailed request",
  "your request is too long",
];

const isGuardrailSuggestion = (message?: string | null) => {
  if (!message) return false;
  const normalized = message.trim().toLowerCase();
  return GUARDRAIL_PATTERNS.some((pattern) => normalized.includes(pattern));
};

interface WardrobeSnapshot {
  wardrobe: any[];
  lastModified?: string;
  version?: string;
  cachedAt?: number;
}

// Types for the 3-column styling interface
export interface WardrobeItem {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
}

export interface StylingOption {
  id: string;
  title: string;
  description: string;
  isFromWardrobe: boolean;
  optionIndex?: number; // 0, 1, or 2 - used for reactive translation
  selectedItemIds: number[];
  outfitItems: WardrobeItem[];
  generatedImage: string | null;
  isLoading: boolean;
  error?: string | null;
}

export interface SuggestTask {
  id: string;
  query: string;
  isLoading: boolean;
  statusLabel: string;
  thinkingDots: string;
  options: StylingOption[];
  activeOptionIndex: number;
  modelImageUrl?: string | null;
  noResultsMessage?: string;
  showResults?: boolean;
  error?: string | null;
}

interface SuggestionResponse {
  selected_ids: number[][];
  suggestion?: string;
}

interface ProfileResponse {
  modelPicture?: string | null;
  modelPictureUrl?: string | null;
}

interface TryOnSuggestedResponse {
  imageUrl: string;
  fileName?: string;
}

const getModelBackendUrl = () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_MODEL_URL || "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const getApiUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const fetchWardrobeSnapshot = async (
  userId: number,
  token: string
): Promise<WardrobeSnapshot> => {
  const cachedKey = `wardrobe_${userId}`;
  const cachedRaw = localStorage.getItem(cachedKey);
  const cached: WardrobeSnapshot | null = cachedRaw ? JSON.parse(cachedRaw) : null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (cached?.version) {
    headers["If-None-Match"] = `W/"${cached.version}"`;
  }

  const wardrobeUrl = `${getApiUrl()}/User/item-descriptions/${userId}/raw`;
  const response = await fetch(wardrobeUrl, { method: "GET", headers });

  if (response.status === 304 && cached) {
    return cached;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch wardrobe");
  }

  const data = await response.json();
  const snapshot: WardrobeSnapshot = {
    wardrobe: data?.wardrobe ?? [],
    lastModified: data?.lastModified,
    version: data?.version,
    cachedAt: Date.now(),
  };

  localStorage.setItem(cachedKey, JSON.stringify(snapshot));
  return snapshot;
};

const fetchModelFileName = async (): Promise<string> => {
  const res = await ClientApi.get<ProfileResponse>("/UserProfile/defaultModelPicture", undefined, false);
  const raw = res.getRaw();
  const profile = raw?.data || {};

  // Get the filename directly
  if (profile?.modelPicture) {
    return profile.modelPicture;
  }

  // Extract from URL if needed
  if (profile?.modelPictureUrl) {
    const fileName = extractFileNameFromUrl(profile.modelPictureUrl);
    if (fileName) return fileName;
  }

  throw new Error("No model picture found. Please upload one before using try-on.");
};

export function useSuggestMulti(options?: { onHistorySaved?: () => void }) {
  const [tasks, setTasks] = useState<SuggestTask[]>([]);
  const onHistorySaved = options?.onHistorySaved;
  const { user } = useAuth();
  const { t } = useTranslation();

  const clearTasks = () => setTasks([]);

  // Animate "Thinking..." dots
  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};

    tasks.forEach((task) => {
      if (task.isLoading && !intervals[task.id]) {
        let count = 0;
        intervals[task.id] = setInterval(() => {
          count = (count + 1) % 4;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, thinkingDots: ".".repeat(count) } : t
            )
          );
        }, 500);
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [tasks]);

  const handleSend = async (query: string) => {
    if (!query.trim()) return;

    const id = crypto.randomUUID();
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const userId = user?.id ? (typeof user.id === "string" ? Number(user.id) : user.id) : null;

    // Initialize task with 3 empty styling options
    const initialOptions: StylingOption[] = [
      {
        id: `${id}-option-1`,
        title: t("outfitSuggest.labels.styleOption", { index: 1 }),
        description: t("outfitSuggest.messages.styleOption1Desc"),
        isFromWardrobe: true,
        optionIndex: 0,
        selectedItemIds: [],
        outfitItems: [],
        generatedImage: null,
        isLoading: true,
        error: null,
      },
      {
        id: `${id}-option-2`,
        title: t("outfitSuggest.labels.styleOption", { index: 2 }),
        description: t("outfitSuggest.messages.styleOption2Desc"),
        isFromWardrobe: true,
        optionIndex: 1,
        selectedItemIds: [],
        outfitItems: [],
        generatedImage: null,
        isLoading: true,
        error: null,
      },
      {
        id: `${id}-option-3`,
        title: t("outfitSuggest.labels.creativeAlternative"),
        description: t("outfitSuggest.messages.creativeAlternativeFullDesc"),
        isFromWardrobe: false,
        optionIndex: 2,
        selectedItemIds: [],
        outfitItems: [],
        generatedImage: null,
        isLoading: true,
        error: null,
      },
    ];

    setTasks((prev) => [
      ...prev,
      {
        id,
        query,
        isLoading: true,
        statusLabel: "Thinking",
        thinkingDots: "",
        options: initialOptions,
        activeOptionIndex: 0,
        showResults: false,
        error: null,
      },
    ]);

    try {
      if (!userId) {
        throw new Error("Please login again to use wardrobe suggestions.");
      }
      if (!token) {
        throw new Error("Missing auth token. Please login again.");
      }

      // Fetch wardrobe data
      const wardrobeSnapshot = await fetchWardrobeSnapshot(userId, token);
      const wardrobeItemIds = wardrobeSnapshot.wardrobe
        .map((item: any) => {
          const rawId = item?.id ?? item?.itemId ?? item?.Id;
          return typeof rawId === "string" ? Number(rawId) : rawId;
        })
        .filter((id: number) => Number.isFinite(id));

      // Get model filename (not base64!)
      const modelFileName = await fetchModelFileName();
      
      // Get presigned URL for the model image to display in comparison
      const modelPresignedUrl = await outfitSuggestService.getPresignedUrl(modelFileName, 'items');
      
      // Update task with the model URL
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, modelImageUrl: modelPresignedUrl } : t
        )
      );

      // Call suggest-outfit ONCE - the endpoint returns 2 outfit sets in selected_ids
      const res = await ClientApi.post<SuggestionResponse>(
        `${getModelBackendUrl()}/suggest-outfit`,
        {
          query,
          wardrobe: wardrobeSnapshot.wardrobe,
          wardrobe_version: wardrobeSnapshot.version,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const raw = res.getRaw();
      if (!raw?.success || !raw.data) {
        throw new Error(raw?.message || "Failed to get outfit suggestions");
      }

      // The endpoint returns selected_ids as [[outfit1_ids], [outfit2_ids]]
      const selectedIds = raw.data.selected_ids || [];
      const outfitSet1 = selectedIds[0] || [];
      const outfitSet2 = selectedIds[1] || [];

      if (!outfitSet1.length && !outfitSet2.length) {
        const suggestionMessage = (raw.data.suggestion ?? "").trim();
        const guardrailHit = isGuardrailSuggestion(suggestionMessage);
        const statusMessage = suggestionMessage || "No matching items found in your wardrobe";

        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isLoading: false,
                  statusLabel: statusMessage,
                  thinkingDots: "",
                  noResultsMessage: guardrailHit ? statusMessage : undefined,
                  showResults: true,
                  options: guardrailHit
                    ? []
                    : t.options.map((opt) => ({ ...opt, isLoading: false })),
                }
              : t
          )
        );
        return;
      }

      // We have outfits; allow UI to render the grid immediately (options are still loading)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                showResults: true,
              }
            : t
        )
      );

      // Fetch item data for all unique items from both suggestions
      const allItemIds = [...new Set([...outfitSet1, ...outfitSet2])];
      const itemDataMap = new Map<number, { imageUrl: string; name: string; category: string }>();

      await Promise.all(
        allItemIds.map(async (itemId) => {
          const itemRes = await ClientApi.get<{
            imageUrl?: string;
            comment?: string; // Item name is stored in 'comment' field
            categoryName?: string;
          }>(`/Item/${itemId}`);
          const raw = itemRes.getRaw()?.data ?? {};
          itemDataMap.set(itemId, {
            imageUrl: raw.imageUrl || "",
            name: raw.comment || `Item ${itemId}`, // Use 'comment' as the name
            category: raw.categoryName || "Unknown",
          });
        })
      );

      // Helper to create WardrobeItem array
      const createOutfitItems = (itemIds: number[]): WardrobeItem[] => {
        return itemIds.map((itemId) => {
          const itemData = itemDataMap.get(itemId);
          return {
            id: itemId,
            name: itemData?.name || `Item ${itemId}`,
            category: itemData?.category || "Unknown",
            imageUrl: itemData?.imageUrl || "",
          };
        });
      };

      // Helper to get filenames for items
      const getItemFileNames = (itemIds: number[]): string[] => {
        return itemIds.map((itemId) => {
          const imageUrl = itemDataMap.get(itemId)?.imageUrl || "";
          return extractFileNameFromUrl(imageUrl) || "";
        }).filter(Boolean);
      };

      const totalStart = performance.now();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, statusLabel: pickGenerationMessage() } : t
        )
      );

      // Prepare outfit sets: [outfitSet1, outfitSet2, empty for Dream Look]
      const optionConfigs = [
        { outfitSet: outfitSet1.length ? outfitSet1 : outfitSet2, isWardrobe: true, endpoint: "/Workshop/tryOnSuggested" },
        { outfitSet: outfitSet2.length ? outfitSet2 : outfitSet1, isWardrobe: true, endpoint: "/Workshop/tryOnSuggested" },
        { outfitSet: [], isWardrobe: false, endpoint: "/Workshop/tryOnAdditionalSuggested" }, // Dream Look - NO wardrobe items
      ];

      // Create 3 parallel try-on API calls
      const tryOnPromises = optionConfigs.map(async (config, index) => {
        const { outfitSet, isWardrobe, endpoint } = config;
        const start = performance.now();

        try {
          // For Dream Look (index 2), only send model image - no wardrobe items
          const itemFileNames = isWardrobe ? getItemFileNames(outfitSet) : [];

          const tryOnRes = await ClientApi.post<TryOnSuggestedResponse>(endpoint, {
            // Images array: Dream Look gets ONLY model, others get model + items
            Images: isWardrobe ? [modelFileName, ...itemFileNames] : [modelFileName],
            clothingItemIds: isWardrobe ? outfitSet : [],
            // Pass user query for Dream Look generation
            UserQuery: query,
            // Additional data for history saving
            QueryText: query,
            WardrobeVersion: wardrobeSnapshot.version,
            WardrobeItemIds: isWardrobe ? wardrobeItemIds : [],
            ModelImageUrl: modelFileName,
          });

          const tryOnRaw = tryOnRes.getRaw();
          if (!tryOnRaw?.success || !tryOnRaw.data?.imageUrl) {
            throw new Error(tryOnRaw?.message || `Try-on ${index + 1} failed`);
          }

          const end = performance.now();
          // console.log(
          //   `Try-on ${index + 1} (${endpoint}) success after ${((end - start) / 1000).toFixed(2)}s`
          // );

          // Update individual option as it completes
          setTasks((prev) =>
            prev.map((task) =>
              task.id === id
                ? {
                    ...task,
                    options: task.options.map((opt, optIdx) =>
                      optIdx === index
                        ? {
                            ...opt,
                            title: !isWardrobe ? t("outfitSuggest.labels.dreamLook") : t("outfitSuggest.labels.styleOption", { index: index + 1 }),
                            description: !isWardrobe
                              ? t("outfitSuggest.messages.beyondWardrobe")
                              : t("outfitSuggest.messages.outfitCombination", { index: index + 1 }),
                            isFromWardrobe: isWardrobe,
                            optionIndex: index, // Preserve optionIndex for reactive translation
                            selectedItemIds: outfitSet,
                            outfitItems: isWardrobe ? createOutfitItems(outfitSet) : [],
                            generatedImage: tryOnRaw.data.imageUrl,
                            isLoading: false,
                            error: null,
                          }
                        : opt
                    ),
                  }
                : task
            )
          );

          return { success: true, index };
        } catch (error: any) {
          //console.error(`Try-on ${index + 1} error:`, error);

          setTasks((prev) =>
            prev.map((task) =>
              task.id === id
                ? {
                    ...task,
                    options: task.options.map((opt, optIdx) =>
                      optIdx === index
                        ? {
                            ...opt,
                            isLoading: false,
                            error: error?.message || `Generation ${index + 1} failed`,
                          }
                        : opt
                    ),
                  }
                : task
            )
          );

          return { success: false, index };
        }
      });

      await Promise.all(tryOnPromises);
      const totalEnd = performance.now();
      const totalDuration = ((totalEnd - totalStart) / 1000).toFixed(2);

      // Wait for state to settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Batch save history with all 3 options
      // Use a ref-like pattern to capture final state
      let finalOptions: StylingOption[] = [];
      
      await new Promise<void>((resolve) => {
        setTasks((prev) => {
          const task = prev.find((t) => t.id === id);
          if (task) {
            finalOptions = [...task.options];
          }
          resolve();
          return prev;
        });
      });

      try {
        const successfulOptions = finalOptions.filter((opt) => opt.generatedImage && !opt.error);
        //console.log(`Found ${successfulOptions.length} successful options to save`);
        
        if (successfulOptions.length > 0) {
          const optionsPayload: StylingOptionRequest[] = successfulOptions.map((opt) => ({
            title: opt.title,
            description: opt.description,
            isFromWardrobe: opt.isFromWardrobe,
            itemIds: opt.selectedItemIds,
            generatedImageUrl: extractFileNameFromUrl(opt.generatedImage),
          }));

          // console.log("Saving options payload:", optionsPayload);

          await outfitSuggestService.saveHistory({
            queryText: query,
            wardrobeVersion: wardrobeSnapshot.version,
            modelImageUrl: modelFileName,
            previewImageUrl: extractFileNameFromUrl(successfulOptions[0]?.generatedImage),
            options: optionsPayload,
          });

          // console.log(`Batch saved ${successfulOptions.length} options to history`);
        } else {
          // console.warn("No successful options found to save - finalOptions:", finalOptions);
        }
      } catch (saveError) {
        // console.error("Failed to save history:", saveError);
        // Don't fail the whole operation if history save fails
      }

      // Final update - mark task as complete
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                isLoading: false,
                statusLabel: `Done in ${totalDuration}s`,
                thinkingDots: "",
                showResults: true,
              }
            : t
        )
      );

      // console.log("Suggestion completed - history batch saved");
      
      // Call onHistorySaved to reload history from backend
      onHistorySaved?.();
    } catch (err: any) {
      setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isLoading: false,
                  error: err?.message || "Error occurred",
                  statusLabel: err?.message || "Error occurred",
                  thinkingDots: "",
                  showResults: true,
                  options: t.options.map((opt) => ({
                    ...opt,
                    isLoading: false,
                    error: err?.message || "Error occurred",
                  })),
              }
            : t
        )
      );
      // console.error("Error:", err);
      showErrorToast(err?.message || "An error occurred");
    }
  };

  const handleRegenerate = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    tasks,
    handleSend,
    handleRegenerate,
    clearTasks,
  };
}
