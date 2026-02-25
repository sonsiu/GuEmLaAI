"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { SuggestTask } from "../hooks/useSuggestMulti";
import type { StylingOptionResponse } from "@/services/outfit-suggest.service";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Drawer from "@mui/material/Drawer";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { styled } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/@core/hooks/useTranslation";
import { showSuccessToast } from "@/services/toast.service";

export interface HistoryEntry {
  id: string | number;
  title: string;
  status: string;
  preview: string | null;
  historyId?: string | number;
  sourceTaskId?: string | number;
  createdAt?: string | number | null;
  queryText?: string;
  generatedImages?: string[];
  outfitDetails?: string[][];
  outfitItemIds?: number[][];
  outfitItemCategories?: (string | null)[][];
  outfitItemNames?: string[][];
  modelImageUrl?: string | null;
  // New: Backend-provided options with titles/descriptions
  options?: StylingOptionResponse[];
}

interface SuggestionHistorySidebarProps {
  tasks: SuggestTask[];
  historyEntries?: HistoryEntry[];
  onSelect?: (entry: HistoryEntry) => void;
  onClear?: () => void;
  onDelete?: (entry: HistoryEntry) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const PAGE_SIZE = 4;

const HistoryCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.spacing(2),
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[6],
    borderColor: theme.palette.primary.main,
  },
}));

const GradientBox = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === "dark"
      ? `linear-gradient(135deg, ${theme.palette.primary.dark}15 0%, ${theme.palette.secondary.dark}15 100%)`
      : `linear-gradient(135deg, ${theme.palette.primary.light}20 0%, ${theme.palette.secondary.light}20 100%)`,
  backdropFilter: "blur(10px)",
  borderRadius: theme.spacing(3),
}));

const formatDateTime = (timestamp?: number | string | null) => {
  if (!timestamp) return "";

  const toDate = (value: number | string) => {
    // Normalize numbers (seconds vs ms) and strings (missing timezone)
    if (typeof value === "number") {
      const isSeconds = value < 1e12;
      return new Date(isSeconds ? value * 1000 : value);
    }

    const raw = value.trim();
    if (!raw) return null;

    // Detect explicit timezone (+hh:mm, -hhmm or trailing Z)
    const hasTimeZone = /([+-]\d{2}:?\d{2}|Z)$/i.test(raw);
    let normalized = raw.replace(" ", "T");

    // If backend timestamp is missing timezone, treat it as UTC to avoid offset drift
    if (!hasTimeZone) {
      normalized = `${normalized}Z`;
    }

    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    // Fallback to native parsing
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };

  try {
    const date = toDate(timestamp);
    if (!date) return "";

    return date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export const SuggestionHistorySidebar: React.FC<SuggestionHistorySidebarProps> = ({
  tasks,
  historyEntries = [],
  onSelect,
  onClear,
  onDelete,
  isOpen = true,
  onToggle,
}) => {
  const { t } = useTranslation();
  
  // Only surface completed tasks with results
  const taskEntries: HistoryEntry[] = useMemo(() => {
    const completed = tasks.filter((task) => {
      if (task.isLoading || task.error) return false;
      // Check if any option has a generated image
      return task.options.some((opt) => opt.generatedImage);
    });

    // Newest task first
    return [...completed].reverse().map((task) => {
      // Extract images and item data from options
      const generatedImages = task.options
        .map((opt) => opt.generatedImage)
        .filter(Boolean) as string[];
      const outfitItemIds = task.options.map((opt) => opt.selectedItemIds);
      const outfitDetails = task.options.map((opt) =>
        opt.outfitItems.map((item) => item.imageUrl)
      );
      const outfitItemCategories = task.options.map((opt) =>
        opt.outfitItems.map((item) => item.category)
      );

      return {
        id: task.id,
        sourceTaskId: task.id,
        title: task.query || "Untitled",
        status: "Done",
        preview: generatedImages[0] ?? null,
        queryText: task.query,
        generatedImages,
        outfitDetails,
        outfitItemIds,
        outfitItemCategories,
        createdAt: undefined,
      };
    });
  }, [tasks]);

  const sortedHistoryEntries = useMemo(() => {
    return [...historyEntries].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [historyEntries]);

  const dedupedTaskEntries = useMemo(() => {
    const historyIds = new Set(sortedHistoryEntries.map((h) => h.id?.toString()).filter(Boolean));
    const historyPreviews = new Set(
      sortedHistoryEntries
        .map((h) => h.preview)
        .filter((p): p is string => Boolean(p))
    );

    return taskEntries.filter((entry) => {
      // Remove if already in history
      if (entry.id && historyIds.has(entry.id.toString())) {
        return false;
      }
      // Also hide live task if its preview already exists in saved history to avoid duplicate "placeholder"
      if (entry.preview && historyPreviews.has(entry.preview)) {
        return false;
      }
      return true;
    });
  }, [sortedHistoryEntries, taskEntries]);

  // Show live tasks first, then saved history (newest first)
  const entries = useMemo(
    () => [...dedupedTaskEntries, ...sortedHistoryEntries],
    [dedupedTaskEntries, sortedHistoryEntries]
  );
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const [deleteEntry, setDeleteEntry] = useState<HistoryEntry | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    // Ensure current page stays within range when entries change
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [entries.length, totalPages]);

  // Reset to first page when a new batch of history arrives
  useEffect(() => {
    setCurrentPage(1);
  }, [historyEntries.length]);

  const pageEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, currentPage]);

  const handleDeleteClick = (event: React.MouseEvent, entry: HistoryEntry) => {
    event.stopPropagation();
    const isPersistedEntry = Boolean(entry.createdAt || entry.historyId);
    if (!onDelete || !isPersistedEntry) return;
    setDeleteEntry(entry);
  };

  const handleConfirmDelete = () => {
    if (deleteEntry) {
      onDelete?.(deleteEntry);
      showSuccessToast(t("outfitSuggest.history.deleteSuccess") || "Suggestion deleted successfully");
    }
    setDeleteEntry(null);
  };

  const handleConfirmClear = () => {
    setIsConfirmOpen(false);
    onClear?.();
  };

  const sidebarContent = (
    <GradientBox
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        mt: { xs: 6, md: 7 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5, lg: 2, xl: 3 },
          py: { xs: 2, sm: 2.5 },
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          borderRadius: "24px 24px 0 0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
            <i className="tabler-history" style={{ fontSize: "clamp(1.25rem, 1.5vw, 1.5rem)", color: "var(--mui-palette-primary-main)" }} />
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem", lg: "1rem", xl: "1.25rem" } }}>
              {t("outfitSuggest.history.title")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              onClick={() => setIsConfirmOpen(true)}
              size="small"
              variant="outlined"
              sx={{
                borderRadius: 8,
                fontSize: { xs: "0.65rem", sm: "0.7rem", xl: "0.75rem" },
                px: { xs: 1.5, sm: 2 },
                py: 0.5,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              {t("outfitSuggest.history.clear")}
            </Button>
            {onToggle && (
              <IconButton
                onClick={onToggle}
                size="small"
                sx={{
                  display: { xs: "flex", lg: "none" },
                  bgcolor: "background.default",
                }}
              >
                <i className="tabler-x" />
              </IconButton>
            )}
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: { xs: "0.65rem", sm: "0.7rem", xl: "0.75rem" } }}>
          {t("outfitSuggest.history.subtitle")}
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 2 },
          "&::-webkit-scrollbar": {
            width: { xs: 4, sm: 6 },
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "divider",
            borderRadius: 3,
          },
        }}
      >
        {entries.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              textAlign: "center",
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "background.default",
            }}
          >
            <i className="tabler-file-search" style={{ fontSize: "clamp(2rem, 3vw, 3rem)", color: "var(--mui-palette-text-secondary)", opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
              {t("outfitSuggest.history.noHistory")}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1, sm: 1.5 } }}>
            <AnimatePresence>
              {pageEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <HistoryCard
                    elevation={2}
                    onClick={() => onSelect?.(entry)}
                  >
                    <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 2 }, position: "relative" }}>
                      {/* Preview Image */}
                      <Box
                        sx={{
                          position: "relative",
                          width: { xs: 50, sm: 55, lg: 50, xl: 60 },
                          height: { xs: 70, sm: 75, lg: 70, xl: 80 },
                          borderRadius: 1.5,
                          overflow: "hidden",
                          bgcolor: "background.default",
                          flexShrink: 0,
                        }}
                      >
                        {entry.preview ? (
                          <Box
                            component="img"
                            src={entry.preview}
                            alt={entry.title}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transition: "transform 0.3s eas e",
                              "&:hover": {
                                transform: "scale(1.1)",
                              },
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              N/A
                            </Typography>
                          </Box>
                        )}

                      </Box>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0, pr: 4 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 0.5,
                            lineHeight: 1.4,
                            fontSize: { xs: "0.8rem", sm: "0.85rem", lg: "0.8rem", xl: "0.875rem" },
                          }}
                        >
                          {entry.title}
                        </Typography>
                        {entry.createdAt && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <i className="tabler-clock" style={{ fontSize: "clamp(0.75rem, 0.875vw, 0.875rem)", color: "var(--mui-palette-text-secondary)" }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem", xl: "0.75rem" } }}>
                              {formatDateTime(entry.createdAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Delete Button */}
                      {onDelete && (entry.createdAt || entry.historyId) && (
                        <IconButton
                          size="medium"
                          onClick={(event) => handleDeleteClick(event, entry)}
                          sx={{
                            position: "absolute",
                            bottom: 12,
                            right: 12,
                            bgcolor: "background.paper",
                            opacity: 0.0,
                            transition: "all 0.2s ease",
                            boxShadow: 2,
                            "&:hover": {
                              bgcolor: "error.main",
                              color: "error.contrastText",
                              opacity: 1,
                              transform: "scale(1.1)",
                            },
                            ".MuiPaper-root:hover &": {
                              opacity: 1,
                            },
                          }}
                        >
                          <i className="tabler-trash" style={{ fontSize: "1.25rem" }} />
                        </IconButton>
                      )}
                    </Box>
                  </HistoryCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}
      </Box>

      {/* Pagination */}
      {entries.length > PAGE_SIZE && (
        <Box
          sx={{
            px: { xs: 2, sm: 2.5, lg: 2, xl: 3 },
            py: { xs: 1.5, sm: 2 },
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: "0 0 24px 24px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              size="small"
              variant="outlined"
              sx={{
                borderRadius: 8,
                px: { xs: 1.5, sm: 2 },
                py: 0.5,
                fontWeight: 600,
                fontSize: { xs: "0.65rem", sm: "0.7rem", xl: "0.75rem" },
              }}
            >
              {t("outfitSuggest.history.pagination.prev")}
            </Button>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem", xl: "0.75rem" } }}>
              {t("outfitSuggest.history.pagination.page")} {currentPage} / {totalPages}
            </Typography>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              size="small"
              variant="outlined"
              sx={{
                borderRadius: 8,
                px: { xs: 1.5, sm: 2 },
                py: 0.5,
                fontWeight: 600,
                fontSize: { xs: "0.65rem", sm: "0.7rem", xl: "0.75rem" },
              }}
            >
              {t("outfitSuggest.history.pagination.next")}
            </Button>
          </Box>
        </Box>
      )}
    </GradientBox>
  );

  return (
    <>
      <Dialog
        open={Boolean(deleteEntry)}
        onClose={() => setDeleteEntry(null)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
            p: { xs: 1, sm: 1.5 },
            minWidth: { xs: 260, sm: 320 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.05rem" } }}>
          {t("outfitSuggest.history.dialogs.deleteTitle")}
        </DialogTitle>
        <DialogContent sx={{ color: "text.secondary", fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
          {t("outfitSuggest.history.dialogs.deleteMessage")}
        </DialogContent>
        <DialogActions sx={{ gap: 1.25, px: { xs: 2, sm: 2.5 }, pb: { xs: 1.5, sm: 2 } }}>
          <Button
            onClick={() => setDeleteEntry(null)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 999, px: 2.5 }}
          >
            {t("outfitSuggest.buttons.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            size="small"
            sx={{ borderRadius: 999, px: 2.5, fontWeight: 700 }}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
            p: { xs: 1, sm: 1.5 },
            minWidth: { xs: 260, sm: 320 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.05rem" } }}>
          {t("outfitSuggest.history.dialogs.clearTitle")}
        </DialogTitle>
        <DialogContent sx={{ color: "text.secondary", fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
          {t("outfitSuggest.history.dialogs.clearMessage")}
        </DialogContent>
        <DialogActions sx={{ gap: 1.25, px: { xs: 2, sm: 2.5 }, pb: { xs: 1.5, sm: 2 } }}>
          <Button
            onClick={() => setIsConfirmOpen(false)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 999, px: 2.5 }}
          >
            {t("outfitSuggest.buttons.cancel")}
          </Button>
          <Button
            onClick={handleConfirmClear}
            variant="contained"
            color="primary"
            size="small"
            sx={{ borderRadius: 999, px: 2.5, fontWeight: 700 }}
          >
            {t("outfitSuggest.history.dialogs.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Desktop Sidebar */}
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          width: isOpen ? { lg: "20vw", xl: "18vw" } : 0,
          minWidth: isOpen ? { lg: 280, xl: 320 } : 0,
          maxWidth: isOpen ? { lg: 400 } : 0,
          opacity: isOpen ? 1 : 0,
          transition: "all 0.3s ease-in-out",
          overflow: "hidden",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onToggle}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: { xs: "85vw", sm: "70vw", md: "50vw" },
            maxWidth: 400,
            bgcolor: "transparent",
            boxShadow: "none",
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};
