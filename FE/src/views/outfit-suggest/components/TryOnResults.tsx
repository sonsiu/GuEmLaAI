"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import { outfitSuggestService } from "@/services/outfit-suggest.service";
import { showSuccessToast, showErrorToast } from "@/services/toast.service";
import { useAuth } from "@/@core/contexts/AuthContext";
import { useTranslation } from "@/@core/hooks/useTranslation";

const LOADING_VARIANTS = [
  "Rendering your outfits—this may take up to a minute.",
  "Generating try-on looks, please keep this tab open.",
  "Stitching the pieces together. Thanks for waiting!",
  "Almost there—making sure the outfits look sharp.",
];

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.spacing(3),
    maxWidth: "35vw",
    maxHeight: "90vh",
    backgroundColor: theme.palette.background.paper,
  },
}));

const ItemCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.spacing(2),
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const OutfitCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.spacing(3),
  transition: "all 0.3s ease",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: theme.shadows[12],
  },
}));

function OutfitDetailModal({
  isOpen,
  onClose,
  imageUrl,
  outfitItems,
  outfitItemIds,
  outfitItemCategories,
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  outfitItems: string[];
  outfitItemIds: number[];
  outfitItemCategories?: (string | null)[];
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitName, setOutfitName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(outfitItems, null, 2));
      alert("Copied outfit image URLs to clipboard!");
    } catch (err) {
      // console.error("Failed to copy:", err);
    }
  };

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleSaveOutfit = async () => {
    if (isSaving) return;
    if (!user?.id) {
      showErrorToast(t("outfitSuggest.errors.userNotAuthenticated"));
      return;
    }

    if (!outfitItems || outfitItems.length === 0) {
      showErrorToast(t("outfitSuggest.errors.failedToSave"));
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
        imagePreview: imageUrl,
        itemIds: outfitItemIds || [],
      });

      showSuccessToast(t("outfitSuggest.messages.outfitSaved"));
      setOutfitName("");
      setShowSaveModal(false);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("outfitSuggest.errors.failedToSave");
      showErrorToast(errorMessage);
      // console.error("Failed to save outfit:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowSaveModal(false);
  };

  const formatCategoryLabel = (category?: string | null) => {
    if (!category) return null;
    const trimmed = category.trim();
    if (!trimmed) return null;

    if (trimmed.includes("_")) {
      const [, ...rest] = trimmed.split("_");
      const withoutPrefix = rest.join(" ").replace(/\s+/g, " ").trim();
      if (withoutPrefix) return withoutPrefix;
      return trimmed.replace(/_/g, " ").trim();
    }

    return trimmed;
  };

  return (
    <>
      <StyledDialog
        open={isOpen}
        onClose={onClose}
        maxWidth={false}
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, height: "100%" }}>
            {/* Left: Items Panel */}
            <Box
              sx={{
                width: { xs: "100%", md: 135 },
                bgcolor: "background.default",
                borderRight: { md: 1 },
                borderBottom: { xs: 1, md: 0 },
                borderColor: "divider",
                p: 3,
                maxHeight: { xs: "40vh", md: "85vh" },
                overflowY: "auto",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                  {t("outfitSuggest.modals.outfitName")}
                </Typography>
                <Tooltip title={t("outfitSuggest.badges.wardrobe")}>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": { bgcolor: "primary.dark" },
                    }}
                  >
                    <i className="tabler-copy" style={{ fontSize: "1rem" }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {outfitItems && outfitItems.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {outfitItems.map((url, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <ItemCard elevation={2}>
                        <Box sx={{ position: "relative", width: "100%", paddingTop: "100%" }}>
                          <img
                            src={url && url.trim() ? url : "/placeholder.png"}
                            alt={`N/A`}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                        </Box>
                        <Box sx={{ p: 1.5, textAlign: "center" }}>
                          <Chip
                            label={formatCategoryLabel(outfitItemCategories?.[idx]) || `Item ${idx + 1}`}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </Box>
                      </ItemCard>
                    </motion.div>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
                  <Box
                    component="img"
                    src="/placeholder.png"
                    alt="No items"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      opacity: 0.5,
                      objectFit: "contain",
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Right: Main Image */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 2, md: 4 },
                bgcolor: "background.paper",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  display: "inline-flex",
                  maxWidth: "100%",
                  maxHeight: { xs: "50vh", md: "85vh" },
                }}
              >
                <Box
                  component="img"
                  src={imageUrl}
                  alt="Full Outfit"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: { xs: "50vh", md: "85vh" },
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 3,
                    display: "block",
                  }}
                />

                {/* Close Button */}
                <IconButton
                  onClick={onClose}
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    bgcolor: "background.paper",
                    boxShadow: 3,
                    "&:hover": { bgcolor: "background.paper", transform: "scale(1.1)" },
                  }}
                >
                  <i className="tabler-x" style={{ fontSize: "1.5rem" }} />
                </IconButton>

                {/* Save Button */}
                <Button
                  onClick={handleSaveClick}
                  variant="contained"
                  startIcon={<i className="tabler-cloud-upload" />}
                  sx={{
                    position: "absolute",
                    bottom: -0,
                    right: -0,
                    borderRadius: 8,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    boxShadow: 6,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 8,
                    },
                  }}
                >
                  {t("outfitSuggest.buttons.saveToOutfits")}
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </StyledDialog>

      {/* Save Modal */}
      <Dialog
        open={showSaveModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {t("outfitSuggest.modals.saveOutfit")}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Outfit Preview */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                paddingTop: "100%",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "background.default",
                mb: 1,
              }}
            >
              <img
                src={imageUrl}
                alt="Outfit preview"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>

            {/* Outfit Name Input */}
            <TextField
              label={t("outfitSuggest.modals.outfitName")}
              placeholder={t("outfitSuggest.modals.outfitNamePlaceholder")}
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
            />

            {/* Item Summary */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {t("outfitSuggest.labels.outfitItems", { count: outfitItemIds.length })}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {outfitItems.map((_, idx) => (
                  <Chip
                    key={idx}
                    label={formatCategoryLabel(outfitItemCategories?.[idx]) || `Item ${idx + 1}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseModal}
            disabled={isSaving}
            color="inherit"
          >
            {t("outfitSuggest.buttons.cancel")}
          </Button>
          <Button
            onClick={handleSaveOutfit}
            disabled={isSaving}
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
          >
            {isSaving ? t("outfitSuggest.buttons.saving") : t("outfitSuggest.buttons.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function TryOnResults({
  isLoading,
  thinkingDots,
  statusLabel,
  generatedImage,
  outfitDetails,
  outfitItemIds,
  outfitItemCategories,
  handleRegenerate,
}: {
  isLoading: boolean;
  thinkingDots: string;
  statusLabel: string;
  generatedImage: string[] | null;
  outfitDetails?: string[][];
  outfitItemIds?: number[][];
  outfitItemCategories?: (string | null)[][];
  handleRegenerate: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCycleIndex(0);
      return;
    }
    setCycleIndex(0);
    const id = setInterval(
      () => setCycleIndex((prev) => (prev + 1) % (LOADING_VARIANTS.length + 1)),
      4500
    );
    return () => clearInterval(id);
  }, [isLoading, statusLabel]);

  const loadingText =
    cycleIndex === 0
      ? statusLabel
      : LOADING_VARIANTS[(cycleIndex - 1) % LOADING_VARIANTS.length];

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
        position: "relative",
        opacity: isLoading ? 0.6 : 1,
        filter: isLoading ? "blur(0.5px)" : "none",
        pointerEvents: isLoading ? "none" : "auto",
        transition: "all 0.3s ease",
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            py: 8,
          }}
        >
          <Box sx={{ position: "relative" }}>
            <CircularProgress
              size={64}
              thickness={4}
              sx={{
                color: "primary.main",
                animationDuration: "1s",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <i className="tabler-sparkles" style={{ fontSize: "1.5rem", color: "var(--mui-palette-primary-main)" }} />
            </Box>
          </Box>

          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Typography variant="h6" color="text.primary" fontWeight={500} textAlign="center">
              {loadingText}
              {thinkingDots}
            </Typography>
          </motion.div>
        </Box>
      ) : generatedImage && generatedImage.length > 0 ? (
        <>
          <Grid
            container
            spacing={{ xs: 2, sm: 3, md: 4 }}
            sx={{
              maxHeight: { xs: "calc(100vh - 200px)", md: "70vh" },
              overflowY: "auto",
              px: { xs: 1, md: 2 },
              py: 2,
            }}
          >
            {generatedImage.map((imgUrl, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <OutfitCard
                    elevation={4}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "133.33%",
                        bgcolor: "background.default",
                      }}
                    >
                      <Box
                        component="img"
                        src={imgUrl}
                        alt={`Generated outfit ${index + 1}`}
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                          p: 2,
                          opacity: 0,
                          transition: "opacity 0.3s ease",
                          "&:hover": {
                            opacity: 1,
                          },
                        }}
                      >
                        <Typography variant="body2" color="white" fontWeight={600}>
                          Outfit {index + 1}
                        </Typography>
                      </Box>
                    </Box>
                  </OutfitCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {selectedIndex !== null && (
            <OutfitDetailModal
              isOpen={selectedIndex !== null}
              onClose={() => setSelectedIndex(null)}
              imageUrl={generatedImage[selectedIndex]}
              outfitItems={outfitDetails?.[selectedIndex] || []}
              outfitItemIds={outfitItemIds?.[selectedIndex] || []}
              outfitItemCategories={outfitItemCategories?.[selectedIndex] || []}
            />
          )}
        </>
      ) : (
        <Box
          sx={{
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
              {statusLabel}
            </Typography>
          </Paper>

          <Button
            onClick={handleRegenerate}
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
            Try Again
          </Button>
        </Box>
      )}
    </Box>
  );
}
