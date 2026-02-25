"use client";

import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { styled, useTheme } from "@mui/material/styles";
import { useTranslation } from "@/@core/hooks/useTranslation";
import type { StylingOption } from "../hooks/useSuggestMulti";

const OptionCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.spacing(4),
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: theme.shadows[16],
  },
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  aspectRatio: "3 / 4",
  backgroundColor: theme.palette.grey[100],
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const BadgeChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "isWardrobe",
})<{ isWardrobe: boolean }>(({ theme, isWardrobe }) => ({
  fontWeight: 700,
  fontSize: "0.625rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(0.5, 0),
  boxShadow: theme.shadows[4],
  backgroundColor: isWardrobe 
    ? "rgba(255, 255, 255, 0.95)" 
    : theme.palette.primary.main,
  color: "#000000",
  backdropFilter: "blur(8px)",
}));

interface StylingOptionCardProps {
  option: StylingOption;
  index: number;
  onSelect: (index: number) => void;
}

export default function StylingOptionCard({ option, index, onSelect }: StylingOptionCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();

  // Generate reactive title and description based on optionIndex
  const displayTitle = option.optionIndex !== undefined 
    ? (option.optionIndex === 2 
        ? t("outfitSuggest.labels.creativeAlternative")
        : t("outfitSuggest.labels.styleOption", { index: option.optionIndex + 1 }))
    : option.title;

  const displayDescription = option.optionIndex !== undefined
    ? (option.optionIndex === 0
        ? t("outfitSuggest.messages.styleOption1Desc")
        : option.optionIndex === 1
          ? t("outfitSuggest.messages.styleOption2Desc")
          : t("outfitSuggest.messages.creativeAlternativeFullDesc"))
    : option.description;

  // Debug logs
  // console.log('🔍 StylingOptionCard Debug:', {
  //   index,
  //   optionIndex: option.optionIndex,
  //   isFromWardrobe: option.isFromWardrobe,
  //   originalTitle: option.title,
  //   displayTitle,
  //   originalDescription: option.description,
  //   displayDescription,
  // });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      style={{ height: "100%" }}
    >
      <OptionCard
        elevation={8}
        sx={{
          bgcolor: isDark ? "background.paper" : "background.paper",
          border: "1px solid",
          borderColor: isDark ? "divider" : "grey.100",
        }}
      >
        {/* Image Area */}
        <ImageContainer>
          {option.generatedImage ? (
            <Box
              component="img"
              src={option.generatedImage}
              alt={option.title}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.7s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.8)",
                backdropFilter: "blur(8px)",
                p: 4,
              }}
            >
              {option.isLoading ? (
                <>
                  <CircularProgress 
                    size={48} 
                    thickness={2}
                    sx={{ mb: 2, color: "primary.main" }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "text.secondary",
                      textAlign: "center",
                    }}
                  >
                    {t("outfitSuggest.status.synthesizing", { index: index + 1 })}
                  </Typography>
                </>
              ) : option.error ? (
                <Box sx={{ textAlign: "center" }}>
                  <i 
                    className="tabler-alert-circle" 
                    style={{ fontSize: "2rem", color: theme.palette.error.main, marginBottom: 8 }} 
                  />
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ fontWeight: 600, display: "block" }}
                  >
                    {option.error}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t("outfitSuggest.status.awaiting")}
                </Typography>
              )}
            </Box>
          )}

          {/* Badge */}
          <Box sx={{ position: "absolute", top: 24, left: 24 }}>
            <BadgeChip
              isWardrobe={option.isFromWardrobe}
              label={option.isFromWardrobe ? t("outfitSuggest.badges.wardrobe") : t("outfitSuggest.badges.dreamLook")}
              size="small"
            />
          </Box>
        </ImageContainer>

        {/* Content Area */}
        <Box sx={{ p: { xs: 3, md: 4 }, flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              mb: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            {displayTitle}
          </Typography>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
              fontStyle: "italic",
              lineHeight: 1.6,
              fontSize: "0.813rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            "{displayDescription}"
          </Typography>

          {/* Action Button */}
          <Button
            onClick={() => onSelect(index)}
            disabled={!option.generatedImage || option.isLoading}
            variant="contained"
            fullWidth
            sx={{
              mt: "auto",
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              boxShadow: option.generatedImage ? 8 : 0,
              bgcolor: option.generatedImage ? "text.primary" : "action.disabledBackground",
              color: option.generatedImage 
                ? (isDark ? "background.paper" : "background.paper")
                : "action.disabled",
              "&:hover": {
                bgcolor: option.generatedImage ? "primary.main" : "action.disabledBackground",
                transform: option.generatedImage ? "translateY(-2px)" : "none",
                boxShadow: option.generatedImage ? 12 : 0,
              },
              transition: "all 0.3s ease",
            }}
          >
            {t("outfitSuggest.buttons.selectLook")}
          </Button>
        </Box>
      </OptionCard>
    </motion.div>
  );
}
