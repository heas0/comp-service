import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const Footer = () => {
  return (
    <Paper square elevation={3} sx={{ p: 2 }}>
      <Box textAlign="center">
        <Typography variant="body2">© 2025 Computer service</Typography>
      </Box>
    </Paper>
  );
};

export default Footer;
