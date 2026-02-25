"use client";

import React from "react";
import { motion } from "framer-motion";
import StylingOptionsGrid from "./StylingOptionsGrid";
import { useSuggestMulti } from "../hooks/useSuggestMulti";
import type { SuggestTask } from "../hooks/useSuggestMulti";
import { outfitSuggestService } from "@/services/outfit-suggest.service";
import { showErrorToast } from "@/services/toast.service";
import { useTranslation } from "@/@core/hooks/useTranslation";
import type { ModelUserResponse } from "@/services/user.types";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { styled, useTheme } from "@mui/material/styles";

interface SuggestionInputMultiProps {
  tasks?: SuggestTask[];
  handleSend?: (query: string) => void | Promise<void>;
  handleRegenerate?: (id: string) => void;
  clearTasks?: () => void;
  onToggleHistory?: () => void;
  isHistoryOpen?: boolean;
  modelUrls?: string[];
  modelImageUrl?: string | null;
  isLoadingModels?: boolean;
  onModelSelect?: (url: string) => void;
  onAddModelFromPanel?: () => void;
  onDeleteModel?: (url: string) => void;
  defaultModelName?: string | null;
  modelUserData?: ModelUserResponse | null;
  userProfile?: { maxImageGeneratePerDay?: number } | null;
}

const GradientPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
  backdropFilter: "blur(20px)",
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
  },
}));

export function SuggestionInputMulti(props: SuggestionInputMultiProps = {}) {
  const hook = useSuggestMulti();
  const { t } = useTranslation();
  const tasks = props.tasks ?? hook.tasks;
  const handleSend = props.handleSend ?? hook.handleSend;
  const handleRegenerate = props.handleRegenerate ?? hook.handleRegenerate;
  const clearTasks = props.clearTasks ?? hook.clearTasks;
  const { onToggleHistory, isHistoryOpen, modelUrls = [], isLoadingModels = false, onModelSelect, onAddModelFromPanel, onDeleteModel, defaultModelName, modelImageUrl, modelUserData, userProfile } = props;
  const [input, setInput] = React.useState("");
  const [isModelPanelOpen, setIsModelPanelOpen] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{ open: boolean; url: string; fileName: string } | null>(null);
  const [isCheckingRequirement, setIsCheckingRequirement] = React.useState(false);
  const [modelPanelHoverTimeout, setModelPanelHoverTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const isSubmitting = tasks.some((t) => t.isLoading) || isCheckingRequirement;
  const hasTasks = tasks.length > 0;
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const SUGGESTIONS = [
    t("outfitSuggest.suggestions.casual"),
    t("outfitSuggest.suggestions.professional"),
    t("outfitSuggest.suggestions.comfortable"),
    t("outfitSuggest.suggestions.stylish"),
    t("outfitSuggest.suggestions.evening"),
  ];

  React.useEffect(() => {
    return () => {
      if (modelPanelHoverTimeout) clearTimeout(modelPanelHoverTimeout);
    };
  }, [modelUrls, isLoadingModels, modelPanelHoverTimeout]);

  const extractFileName = (url: string): string | null => {
    // Extract filename from presigned URL using regex
    // Pattern matches the last segment after the last slash, including extension
    const match = url.match(/\/([^/\?]+\.(jpg|jpeg|png|gif|webp|bmp))(?:\?|$)/i);
    return match ? match[1] : null;
  };

  const handleModelClick = (url: string) => {
    const fileName = extractFileName(url);
    if (!fileName) {
      // console.error("Failed to extract filename from URL:", url);
      return;
    }
    setConfirmDialog({ open: true, url, fileName });
  };

  const handleConfirmSetDefault = async () => {
    if (!confirmDialog) return;

    try {
      await onModelSelect?.(confirmDialog.url);
      setConfirmDialog(null);
    } catch (err) {
      // console.error("Failed to set default model:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (input.trim()) {
      // Check if default model has been removed
      if (defaultModelName) {
        const defaultModelExists = modelUrls?.some((url) => {
          const fileName = extractFileName(url);
          return fileName === defaultModelName;
        });

        if (!defaultModelExists) {
          showErrorToast(
            t("outfitSuggest.messages.modelRemoved")
          );
          setIsModelPanelOpen(true);
          return;
        }
      }

      // Check try-on limit first (use actual user's max limit from profile)
      const used = modelUserData?.todayImageGeneratedCount || 0;
      const maxLimit = userProfile?.maxImageGeneratePerDay || 40;
      
      if (used >= maxLimit) {
        showErrorToast(
          t("outfitSuggest.errors.tryOnLimitReached") || 
          `Daily try-on limit reached (${maxLimit}/${maxLimit}). Try again tomorrow!`
        );
        return;
      }

      // Check item requirement before sending suggestion
      setIsCheckingRequirement(true);
      try {
        const requirement = await outfitSuggestService.checkItemCreatedRequirement();
        
        if (!requirement.requirementMet) {
          showErrorToast(t("outfitSuggest.messages.insufficientItems"));
          setIsCheckingRequirement(false);
          return;
        }

        // Requirement met, proceed with sending suggestion
        await handleSend(input);
        if (tasks.length > 0) {
          clearTasks();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t("outfitSuggest.errors.failedCheckRequirement");
        showErrorToast(errorMessage);
        // console.error("Error checking item requirement:", error);
      } finally {
        setIsCheckingRequirement(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const showInputForm = tasks.length === 0;

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: showInputForm ? "center" : "flex-start",
        minHeight: showInputForm ? { xs: "calc(100vh - 64px)", md: "80vh" } : "auto",
        height: showInputForm ? "auto" : "100%",
        position: "relative",
        p: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 12, sm: 14, md: 16 }, // Extra bottom padding for cards
        overflowY: showInputForm ? "visible" : "auto",
        overflowX: "hidden",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 20% 50%, ${theme.palette.primary.dark}15 0%, transparent 50%),
               radial-gradient(circle at 80% 80%, ${theme.palette.secondary.dark}15 0%, transparent 50%)`
            : `radial-gradient(circle at 20% 50%, ${theme.palette.primary.light}20 0%, transparent 50%),
               radial-gradient(circle at 80% 80%, ${theme.palette.secondary.light}20 0%, transparent 50%)`,
      }}
    >
      {/* History Toggle Button */}
      {onToggleHistory && (
        <Box
          sx={{
            position: "absolute",
            top: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            alignItems: "flex-end",
          }}
        >
          {/* Toggle Buttons Row */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={() => setIsModelPanelOpen(!isModelPanelOpen)}
              onMouseEnter={() => {
                // Only auto-open on hover for desktop (min-width: 1024px)
                if (window.innerWidth >= 1024) {
                  if (modelPanelHoverTimeout) clearTimeout(modelPanelHoverTimeout);
                  setIsModelPanelOpen(true);
                }
              }}
              onMouseLeave={() => {
                // Auto-close after delay when leaving button (desktop only)
                if (window.innerWidth >= 1024 && isModelPanelOpen) {
                  const timeout = setTimeout(() => {
                    setIsModelPanelOpen(false);
                  }, 300); // 300ms delay before closing
                  setModelPanelHoverTimeout(timeout);
                }
              }}
              sx={{
                bgcolor: "background.paper",
                border: "2px solid",
                borderColor: isModelPanelOpen ? "primary.main" : "divider",
                boxShadow: 3,
                "&:hover": {
                  bgcolor: "background.paper",
                  borderColor: "primary.main",
                  transform: "translateY(-2px)",
                  boxShadow: 6,
                },
                transition: "all 0.2s ease",
              }}
              title={isModelPanelOpen ? t("outfitSuggest.buttons.hideModels") : t("outfitSuggest.buttons.showModels")}
            >
              <i className="tabler-user" style={{ fontSize: "1.25rem" }} />
            </IconButton>

            <IconButton
              onClick={onToggleHistory}
              sx={{
                bgcolor: "background.paper",
                border: "2px solid",
                borderColor: isHistoryOpen ? "primary.main" : "divider",
                boxShadow: 3,
                "&:hover": {
                  bgcolor: "background.paper",
                  borderColor: "primary.main",
                  transform: "translateY(-2px)",
                  boxShadow: 6,
                },
                transition: "all 0.2s ease",
              }}
              title={isHistoryOpen ? t("outfitSuggest.buttons.hideHistory") : t("outfitSuggest.buttons.showHistory")}
            >
              <i className="tabler-history" style={{ fontSize: "1.25rem" }} />
            </IconButton>
          </Box>

          {/* Model Gallery Panel */}
          <Collapse in={isModelPanelOpen} timeout={300}>
            <Paper
              elevation={4}
              onMouseEnter={() => {
                // Keep panel open when hovering over it (desktop only)
                if (window.innerWidth >= 1024) {
                  if (modelPanelHoverTimeout) clearTimeout(modelPanelHoverTimeout);
                }
              }}
              onMouseLeave={() => {
                // Auto-close after delay when leaving panel (desktop only)
                if (window.innerWidth >= 1024) {
                  const timeout = setTimeout(() => {
                    setIsModelPanelOpen(false);
                  }, 300); // 300ms delay before closing
                  setModelPanelHoverTimeout(timeout);
                }
              }}
              sx={{
                p: 2,
                width: 280,
                borderRadius: 2,
                bgcolor: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
                backdropFilter: "blur(16px)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                {t("outfitSuggest.modals.modelGallery")}
              </Typography>

              {isLoadingModels ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 1,
                    }}
                  >
                  {/* Render model images and fill remaining slots with placeholders (max 6) */}
                  {[...Array(6)].map((_, idx) => {
                    const modelUrl = modelUrls[idx];
                    if (modelUrl) {
                      const fileName = extractFileName(modelUrl);
                      const isDefault = fileName && defaultModelName && fileName === defaultModelName;
                      
                      return (
                        <Box
                          key={idx}
                          sx={{
                            position: "relative",
                            aspectRatio: "9/16",
                            borderRadius: 1,
                            overflow: "hidden",
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: isDefault ? "primary.main" : "divider",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "primary.main",
                              transform: "scale(1.05)",
                              boxShadow: 3,
                              "& .delete-icon": {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={modelUrl}
                            alt={`Model ${idx + 1}`}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          
                          {/* Delete icon - top left */}
                          <IconButton
                            className="delete-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteModel?.(modelUrl);
                            }}
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 4,
                              left: 4,
                              opacity: 0,
                              transition: "opacity 0.2s ease",
                              bgcolor: "rgba(0, 0, 0, 0.6)",
                              color: "white",
                              padding: "2px",
                              "&:hover": {
                                bgcolor: "error.main",
                              },
                            }}
                          >
                            <i className="tabler-trash" style={{ fontSize: "14px" }} />
                          </IconButton>

                          {/* Set as Default button at bottom */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDefault) {
                                handleModelClick(modelUrl);
                              }
                            }}
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: isDefault ? "primary.main" : "rgba(255, 255, 255, 0.9)",
                              color: isDefault ? "primary.contrastText" : "#000000",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              py: 0.5,
                              borderRadius: 0,
                              minHeight: "auto",
                              cursor: isDefault ? "default" : "pointer",
                              "&:hover": {
                                bgcolor: isDefault ? "primary.main" : "rgba(255, 255, 255, 1)",
                              },
                            }}
                          >
                            {isDefault ? "Default" : t("outfitSuggest.buttons.setAsDefault") || "Set as Default"}
                          </Button>
                        </Box>
                      );
                    }
                    // Empty placeholder slot
                    return (
                      <Box
                        key={`placeholder-${idx}`}
                        sx={{
                          aspectRatio: "9/16",
                          borderRadius: 1,
                          bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                          border: "1px dashed",
                          borderColor: "divider",
                        }}
                      />
                    );
                  })}
                  </Box>

                  {/* + Add Button */}
                  <Button
                    onClick={onAddModelFromPanel}
                    variant="outlined"
                    fullWidth
                    startIcon={<span style={{ fontSize: "1.5rem" }}>+</span>}
                    sx={{
                      borderRadius: 1,
                      borderStyle: "dashed",
                      borderColor: "primary.main",
                      color: "primary.main",
                      fontWeight: 600,
                      py: 1.25,
                      mt: 2,
                      "&:hover": {
                        bgcolor: "primary.lighterOpacity",
                        borderStyle: "dashed",
                      },
                    }}
                  >
                    {t("outfitSuggest.buttons.addModel") || "Add Model"}
                  </Button>
                </>
              )}
            </Paper>
          </Collapse>
        </Box>
      )}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: hasTasks ? { xs: "100%", lg: "1400px" } : { xs: "100%", sm: "720px", md: "900px" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 4, md: 6 },
          pt: hasTasks ? { xs: 8, md: 12 } : 0,
        }}
      >
        {/* New Chat Button */}
        {hasTasks && clearTasks && (
          <Box sx={{ position: "absolute", left: 0, top: 0, mt: { xs: 2, md: 3 } }}>
            <Button
              onClick={clearTasks}
              variant="outlined"
              startIcon={<i className="tabler-plus" />}
              sx={{
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  transform: "translateY(-2px)",
                  boxShadow: (theme) => theme.shadows[4],
                },
              }}
            >
              {t("outfitSuggest.buttons.newChat")}
            </Button>
          </Box>
        )}

        {/* Welcome Section */}
        {showInputForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: "100%", textAlign: "center" }}
          >
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2.5,
                  py: 1,
                  borderRadius: 50,
                  bgcolor: "primary.lighter",
                  border: "2px solid",
                  borderColor: "primary.main",
                  mb: 3,
                }}
              >
                <i className="tabler-sparkles" style={{ fontSize: "1.2rem" }} />
                <Typography variant="caption" fontWeight={700} color="primary">
                  AI-Powered Styling
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  mb: 2,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("outfitSuggest.messages.welcomeTitle")}
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  maxWidth: "600px",
                  mx: "auto",
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                {t("outfitSuggest.messages.welcomeSubtitle")}
              </Typography>
            </Box>
          </motion.div>
        )}

        {/* Input Form */}
        {showInputForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ width: "100%" }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
            >
              <GradientPaper
                elevation={6}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1,
                  borderRadius: 4,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <Box sx={{ pl: 2, color: "primary.main", display: "flex", alignItems: "center" }}>
                  <i className="tabler-sparkles" style={{ fontSize: "1.5rem" }} />
                </Box>

                <TextField
                  fullWidth
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me what you'd like to wear today..."
                  disabled={isSubmitting}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      px: 2,
                      py: 1.5,
                      fontSize: { xs: "1rem", md: "1.125rem" },
                      fontWeight: 500,
                    },
                  }}
                />

                <IconButton
                  type="submit"
                  disabled={isSubmitting || !input.trim()}
                  sx={{
                    bgcolor: input.trim() && !isSubmitting ? "primary.main" : "action.disabledBackground",
                    color: input.trim() && !isSubmitting ? "primary.contrastText" : "action.disabled",
                    borderRadius: 3,
                    p: 1.5,
                    m: 0.5,
                    "&:hover": {
                      bgcolor: input.trim() && !isSubmitting ? "primary.dark" : "action.disabledBackground",
                      transform: input.trim() && !isSubmitting ? "translateY(-2px)" : "none",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <i className="tabler-send" style={{ fontSize: "1.25rem" }} />
                </IconButton>
              </GradientPaper>
            </Box>
          </motion.div>
        )}

        {/* Suggestion Chips */}
        {showInputForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ width: "100%" }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5 }}>
              {SUGGESTIONS.map((suggestion, idx) => (
                <Chip
                  key={idx}
                  label={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    px: 1,
                    py: 2.5,
                    fontWeight: 500,
                    fontSize: { xs: "0.813rem", sm: "0.875rem" },
                    borderWidth: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "primary.lighter",
                      transform: "translateY(-2px)",
                      boxShadow: (theme) => theme.shadows[3],
                    },
                  }}
                />
              ))}
            </Box>
          </motion.div>
        )}

        {/* Results List - New 3-Column Grid Layout */}
        <Box sx={{ width: "100%", maxWidth: "100vw", display: "flex", flexDirection: "column", gap: { xs: 6, md: 8 }, mt: 4, pb: 6 }}>
          {tasks.map((task) => (
            <Box key={task.id} sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
              {/* New Styling Options Grid */}
                <StylingOptionsGrid
                  task={task}
                  onRegenerate={() => handleRegenerate(task.id)}
                  modelImageUrl={modelImageUrl}
                />
                
              {/* Global task error */}
              {task.error && task.options?.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "error.lighter",
                    border: "1px solid",
                    borderColor: "error.light",
                    borderRadius: 3,
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" color="error.main" fontWeight={500}>
                    {task.error}
                  </Typography>
                </Paper>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog?.open ?? false}
        onClose={() => setConfirmDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Set Default Model
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to set this as your default model?
          </Typography>
          {confirmDialog?.url && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Box
                component="img"
                src={confirmDialog.url}
                alt="Selected model"
                sx={{
                  maxWidth: 200,
                  maxHeight: 200,
                  borderRadius: 2,
                  border: "2px solid",
                  borderColor: "primary.main",
                }}
              />
            </Box>
          )}
          {/* <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
            File: {confirmDialog?.fileName}
          </Typography> */}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog(null)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSetDefault}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
