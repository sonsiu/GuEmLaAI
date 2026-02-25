"use client";

import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import { useTheme, styled } from "@mui/material/styles";
import StylingOptionCard from "./StylingOptionCard";
import type { SuggestTask, StylingOption } from "../hooks/useSuggestMulti";
import { outfitSuggestService } from "@/services/outfit-suggest.service";
import { showSuccessToast, showErrorToast } from "@/services/toast.service";
import { useAuth } from "@/@core/contexts/AuthContext";
import { useTranslation } from "@/@core/hooks/useTranslation";
import itemData from "@/../../public/item.json";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.spacing(4),
    maxWidth: "90vw",
    maxHeight: "90vh",
    backgroundColor: theme.palette.background.paper,
  },
}));

interface StylingOptionsGridProps {
  task: SuggestTask;
  onRegenerate?: () => void;
  modelImageUrl?: string | null; // Fallback for live tasks
}

export default function StylingOptionsGrid({ task, onRegenerate, modelImageUrl: fallbackModelImageUrl }: StylingOptionsGridProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuth();
  const { lang, t } = useTranslation();
  
  // Use task's model image URL (from history) or fallback to prop (for live tasks)
  const modelImageUrl = task.modelImageUrl || fallbackModelImageUrl;
  
  const [selectedOption, setSelectedOption] = useState<{ index: number; option: StylingOption } | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitName, setOutfitName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Create a lookup map for category codes to names
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; name_vn: string }>();
    
    Object.entries(itemData.category).forEach(([_, items]) => {
      (items as Array<{ name: string; name_vn: string; category_code: string }>).forEach(item => {
        map.set(item.category_code.toLowerCase(), {
          name: item.name,
          name_vn: item.name_vn
        });
      });
    });
    
    return map;
  }, []);

  // Helper function to get display name for category
  const getCategoryDisplayName = (categoryCode: string | null | undefined): string => {
    if (!categoryCode) return "Unknown";
    
    const category = categoryMap.get(categoryCode.toLowerCase());
    if (!category) return categoryCode;
    
    return lang === "vi" ? category.name_vn : category.name;
  };

  const handleSelectOption = (index: number) => {
    const option = task.options[index];
    if (option?.generatedImage) {
      setSelectedOption({ index, option });
    }
  };

  const handleCloseDetail = () => {
    setSelectedOption(null);
  };

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleSaveOutfit = async () => {
    if (isSaving || !selectedOption) return;
    if (!user?.id) {
      showErrorToast(t("outfitSuggest.errors.userNotAuthenticated"));
      return;
    }

    setIsSaving(true);
    try {
      const userId = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;
      if (isNaN(userId)) {
        showErrorToast(t("outfitSuggest.errors.invalidUserId"));
        return;
      }

      await outfitSuggestService.saveOutfitFromSuggestion({
        userId,
        name: outfitName || t("outfitSuggest.labels.untitledOutfit"),
        imagePreview: selectedOption.option.generatedImage || "",
        itemIds: selectedOption.option.selectedItemIds || [],
      });

      showSuccessToast(t("outfitSuggest.messages.outfitSaved"));
      setOutfitName("");
      setShowSaveModal(false);
      setSelectedOption(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("outfitSuggest.errors.failedToSave");
      showErrorToast(errorMessage);
     // console.error("Failed to save outfit:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!task.showResults) {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2.5,
          py: 8,
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "4px solid",
              borderColor: "primary.light",
              borderTopColor: "primary.main",
              animation: "spin 1s linear infinite",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
            }}
          >
            <i className="tabler-sparkles" style={{ fontSize: "1.25rem" }} />
          </Box>
        </Box>
        <Typography variant="body1" color="text.primary" fontWeight={600} textAlign="center">
          {task.statusLabel || t("outfitSuggest.status.generatingLooks")}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t("outfitSuggest.status.keepTabOpen")}
        </Typography>
      </Box>
    );
  }

  if (task.noResultsMessage) {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          py: 8,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: "2px dashed",
            borderColor: "divider",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <i className="tabler-mood-sad" style={{ fontSize: "3rem", color: "var(--mui-palette-text-secondary)" }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            {task.noResultsMessage}
          </Typography>
        </Paper>

        {onRegenerate && (
          <Button
            onClick={onRegenerate}
            variant="contained"
            startIcon={<i className="tabler-refresh" />}
            sx={{
              borderRadius: 8,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 6,
              },
            }}
          >
            {t("outfitSuggest.buttons.tryAgain")}
          </Button>
        )}
      </Box>
    );
  }

  const isGenerating = task.isLoading || task.options.some(opt => opt.isLoading);

  return (
    <Box sx={{ width: "100%", pb:"4", overflow: "visible" }}>
      {/* Styled Container with Background */}
      <Box
        sx={{
          bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
          borderRadius: 6,
          p: { xs: 3, md: 5 },
          border: "1px solid",
          borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
          boxShadow: isDark 
            ? "0 4px 24px rgba(0, 0, 0, 0.4)" 
            : "0 4px 24px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Task Header */}
        <Box 
          sx={{ 
            mb: 4, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                letterSpacing: "0.2em",
                mb: 0.5,
                display: "block",
              }}
            >
               {t("outfitSuggest.labels.activeSession")}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              "{task.query}"
            </Typography>
          </Box>

          {isGenerating && (
            <Chip
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    animation: "pulse 1.5s infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1, transform: "scale(1)" },
                      "50%": { opacity: 0.5, transform: "scale(0.8)" },
                    },
                  }}
                />
              }
              label={task.statusLabel || "Generating..."}
              sx={{
                bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
                border: "1px solid",
                borderColor: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)",
                fontWeight: 700,
                fontSize: "0.625rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                px: 1,
                backdropFilter: "blur(8px)",
              }}
            />
          )}
        </Box>

        {/* 3-Column Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: { xs: 3, md: 3, lg: 3 },
          }}
        >
          {task.options.map((option, index) => (
            <StylingOptionCard
              key={option.id}
              option={option}
              index={index}
              onSelect={handleSelectOption}
            />
          ))}
        </Box>
      </Box>

      {/* Detail Modal */}
      <StyledDialog
        open={Boolean(selectedOption)}
        onClose={handleCloseDetail}
        maxWidth="lg"
        fullWidth
        key={`dialog-${selectedOption?.index}-${modelImageUrl}`}
      >
        {selectedOption && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
              <Box>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: "0.15em" }}>
                  {selectedOption.option.isFromWardrobe ? t("outfitSuggest.labels.fromWardrobe") : t("outfitSuggest.labels.creativeAlternative")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {selectedOption.option.title}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDetail} size="small">
                <i className="tabler-x" style={{ fontSize: "1.25rem" }} />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "60vh" }}>
                {/* Side-by-Side Image Comparison */}
                <Box
                  sx={{
                    flex: 2,
                    display: "flex",
                    flexDirection: "column",
                    p: { xs: 2, md: 3 },
                    bgcolor: isDark ? "grey.900" : "grey.50",
                  }}
                >
                  {/* Comparison Labels */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    {modelImageUrl && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          flex: 1, 
                          textAlign: "center", 
                          fontWeight: 700, 
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "text.secondary",
                        }}
                      >
                        {t("outfitSuggest.labels.originalModel")}
                      </Typography>
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        flex: 1, 
                        textAlign: "center", 
                        fontWeight: 700, 
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "primary.main",
                      }}
                    >
                      {selectedOption.option.isFromWardrobe ? t("outfitSuggest.labels.tryOnResult") : t("outfitSuggest.labels.dreamLook")}
                    </Typography>
                  </Box>
                  
                  {/* Images Container */}
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Model Image */}
                    {modelImageUrl && (
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          maxHeight: "70vh",
                        }}
                      >
                        <Box
                          component="img"
                          key={`model-img-${modelImageUrl}`}
                          src={modelImageUrl}
                          alt="Original Model"
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "70vh",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 3,
                            border: "2px solid",
                            borderColor: "divider",
                          }}
                        />
                      </Box>
                    )}
                    
                    {/* Generated Image */}
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        maxHeight: "70vh",
                      }}
                    >
                      <Box
                        component="img"
                        src={selectedOption.option.generatedImage || ""}
                        alt={selectedOption.option.title}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "70vh",
                          height: "auto",
                          objectFit: "contain",
                          borderRadius: 3,
                          border: "2px solid",
                          borderColor: "primary.main",
                          boxShadow: 4,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Details Panel */}
                <Box
                  sx={{
                    flex: 1,
                    p: { xs: 3, md: 4 },
                    borderTop: { xs: 1, md: 0 },
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: { md: 320 },
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: "italic" }}>
                    "{selectedOption.option.description}"
                  </Typography>

                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 700, letterSpacing: "0.15em", color: "text.secondary", mb: 2 }}
                  >
                    {t("outfitSuggest.labels.outfitItems", { count: selectedOption.option.outfitItems.length })}
                  </Typography>

                  <Box sx={{ flex: 1, overflowY: "auto", mb: 3 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 1,
                        maxWidth: 320,
                        mx: "auto",
                      }}
                    >
                      {selectedOption.option.outfitItems.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            p: 1,
                            borderRadius: 2,
                            bgcolor: isDark ? "rgba(255,255,255,0.05)" : "grey.50",
                            border: "1px solid",
                            borderColor: "divider",
                            width: "100%",
                          }}
                        >
                          <Box
                            component="img"
                            src={item.imageUrl || "/placeholder.png"}
                            alt={item.name}
                            sx={{
                              width: "100%",
                              height: "auto",
                              aspectRatio: "1",
                              borderRadius: 1.5,
                              objectFit: "cover",
                              border: "1px solid",
                              borderColor: "divider",
                              mb: 1,
                            }}
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="primary.main" 
                            sx={{ 
                              fontWeight: 600, 
                              textTransform: "uppercase",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {getCategoryDisplayName(item.category)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Save Button - Only for wardrobe-based outfits */}
                  {selectedOption.option.isFromWardrobe ? (
                    <Button
                      onClick={handleSaveClick}
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<i className="tabler-cloud-upload" />}
                      sx={{
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "1rem",
                      }}
                    >
                      {t("outfitSuggest.buttons.saveToOutfits")}
                    </Button>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          gap: 1,
                          fontStyle: "italic",
                        }}
                      >
                        <i className="tabler-info-circle" style={{ fontSize: "1rem" }} />
                        {t("outfitSuggest.messages.dreamLooksInfo")}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </StyledDialog>

      {/* Save Modal */}
      <Dialog
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("outfitSuggest.modals.saveOutfit")}</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            label={t("outfitSuggest.modals.outfitName")}
            value={outfitName}
            onChange={(e) => setOutfitName(e.target.value)}
            placeholder={t("outfitSuggest.modals.outfitNamePlaceholder")}
            sx={{ mb: 2 }}
          />
          {selectedOption?.option.generatedImage && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                component="img"
                src={selectedOption.option.generatedImage}
                alt="Outfit preview"
                sx={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setShowSaveModal(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            {t("outfitSuggest.buttons.cancel")}
          </Button>
          <Button
            onClick={handleSaveOutfit}
            variant="contained"
            disabled={isSaving}
            sx={{ borderRadius: 2 }}
          >
            {isSaving ? t("outfitSuggest.buttons.saving") : t("outfitSuggest.buttons.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
