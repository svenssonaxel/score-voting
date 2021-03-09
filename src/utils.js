import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
} from "@material-ui/core";
import Draggable from "react-draggable";

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

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

export function ConfirmHelper({ title, text, fun }) {
  const [open, setOpen] = React.useState(false);
  return {
    elementProps: { onClick: () => setOpen(true) },
    dialog: (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: "move" }} id="draggable-dialog-title">
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              fun();
            }}
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    ),
  };
}
