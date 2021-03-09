import React from "react";

export function rndId(entropy = 32) {
  const chars = "EHJKRWXY79"; // Uppercase letters and numbers except those that are possible to confuse when reading (A4 B8 G6 I1L O0Q S5 UV Z2) or listening (BDPT3 CZ FS MN).
  let ret = "";
  while (entropy >= 0) {
    ret += chars[Math.floor(Math.random() * chars.length)];
    entropy -= Math.log2(chars.length);
  }
  return ret;
}

export function PopoverHelper(corner) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const corners = {
    n: {
      vertical: "top",
      horizontal: "center",
    },
    ne: {
      vertical: "top",
      horizontal: "right",
    },
    e: {
      vertical: "center",
      horizontal: "right",
    },
    se: {
      vertical: "bottom",
      horizontal: "right",
    },
    s: {
      vertical: "bottom",
      horizontal: "center",
    },
    sw: {
      vertical: "bottom",
      horizontal: "left",
    },
    w: {
      vertical: "center",
      horizontal: "left",
    },
    nw: {
      vertical: "top",
      horizontal: "left",
    },
    c: {
      vertical: "center",
      horizontal: "center",
    },
  };
  return {
    elementProps: {
      onClick: (e) => setAnchorEl(e.currentTarget),
    },
    PopoverProps: {
      open: Boolean(anchorEl),
      onClose: () => setAnchorEl(null),
      anchorEl,
      anchorOrigin: corners[corner],
      transformOrigin: corners[corner],
      disableRestoreFocus: true,
    },
  };
}
