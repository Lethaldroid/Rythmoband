import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { faqs } from "../utils/faq";

function Faq() {
  const [expanded, setExpanded] = useState(0);

  const handleChange = (index) => (_event, isExpanded) => {
    setExpanded(isExpanded ? index : false);
  };

  return (
    <Box
      component="section"
      aria-labelledby="faq-title"
      sx={{ pt: { xs: 7, md: 10 }, pb: { xs: 10, md: 14 }, position: "relative", overflow: "hidden" }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" component="p" sx={{ color: "#ff8a6e", mb: 1.5 }}>
            Support
          </Typography>
          <Typography id="faq-title" variant="h1" sx={{ fontSize: { xs: 38, sm: 52 }, mb: 2 }}>
            Frequently asked questions
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", fontSize: { xs: 16, sm: 18 } }}>
            Quick answers about plans, billing and your account.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {faqs.map((faq, index) => {
            const summaryId = `faq-question-${index}`;
            const panelId = `faq-answer-${index}`;
            return (
              <Accordion
                key={faq.title}
                disableGutters
                elevation={0}
                expanded={expanded === index}
                onChange={handleChange(index)}
              >
                {/* Heading wraps the toggle so the question stays in the heading outline */}
                <Typography component="h2" sx={{ m: 0, fontSize: "inherit", fontFamily: "inherit" }}>
                  <AccordionSummary
                    id={summaryId}
                    aria-controls={panelId}
                    expandIcon={<ExpandMoreRoundedIcon aria-hidden sx={{ color: "var(--text-muted)" }} />}
                    sx={{
                      minHeight: 56,
                      px: { xs: 2, sm: 3 },
                      "& .MuiAccordionSummary-content": { my: 1.75 },
                    }}
                  >
                    <Box component="span" sx={{ fontSize: 17, fontWeight: 600, color: "var(--text-main)" }}>
                      {faq.title}
                    </Box>
                  </AccordionSummary>
                </Typography>
                <AccordionDetails
                  id={panelId}
                  sx={{ px: { xs: 2, sm: 3 }, pt: 0, pb: 2.5 }}
                >
                  <Typography sx={{ color: "var(--text-muted)", lineHeight: 1.7 }}>{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>

        {/* Still have questions */}
        <Box
          component="aside"
          aria-labelledby="faq-more-title"
          sx={{
            mt: { xs: 6, md: 8 },
            p: { xs: 3, sm: 4 },
            borderRadius: "20px",
            border: "1px solid var(--border)",
            bgcolor: "var(--bg-surface)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: "var(--primary-soft)",
                color: "var(--primary)",
                flexShrink: 0,
              }}
            >
              <MenuBookRoundedIcon aria-hidden />
            </Box>
            <Box>
              <Typography id="faq-more-title" variant="h2" sx={{ fontSize: 22, mb: 0.5 }}>
                Still have questions?
              </Typography>
              <Typography sx={{ color: "var(--text-muted)" }}>
                The user guide walks you through the studio step by step and
                lists every keyboard shortcut.
              </Typography>
            </Box>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexShrink: 0, width: { xs: "100%", sm: "auto" } }}>
            <Button component={Link} to="/user-guide" variant="contained">
              Read the user guide
            </Button>
            <Button component={Link} to="/pricing" variant="outlined">
              See plans
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Faq;
