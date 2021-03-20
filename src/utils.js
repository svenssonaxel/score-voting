import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  Paper,
  Tooltip,
} from "@material-ui/core";
import Draggable from "react-draggable";
import { Add, Delete } from "@material-ui/icons";
import * as _ from "lodash";

export function rndId(entropy = 32) {
  const chars = "EHJKRWXY79"; // Uppercase letters and numbers except those that are possible to confuse when reading (A4 B8 G6 I1L O0Q S5 UV Z2) or listening (BDPT3 CZ FS MN).
  let ret = "";
  while (entropy >= 0) {
    ret += chars[Math.floor(Math.random() * chars.length)];
    entropy -= Math.log2(chars.length);
  }
  return ret;
}

export function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export function PopoverHelper(corner) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const onCloseFunctions = [];
  const corners = {
    n: { vertical: "top", horizontal: "center" },
    ne: { vertical: "top", horizontal: "right" },
    e: { vertical: "center", horizontal: "right" },
    se: { vertical: "bottom", horizontal: "right" },
    s: { vertical: "bottom", horizontal: "center" },
    sw: { vertical: "bottom", horizontal: "left" },
    w: { vertical: "center", horizontal: "left" },
    nw: { vertical: "top", horizontal: "left" },
    c: { vertical: "center", horizontal: "center" },
  };
  return {
    elementProps: {
      onClick: (e) => setAnchorEl(e.currentTarget),
    },
    PopoverProps: {
      open: Boolean(anchorEl),
      onClose: () => {
        for (let fun of onCloseFunctions) {
          fun();
        }
        setAnchorEl(null);
      },
      anchorEl,
      anchorOrigin: corners[corner],
      transformOrigin: corners[corner],
      disableRestoreFocus: true,
      PaperProps: { elevation: 24 },
    },
    onClose(fun) {
      onCloseFunctions.push(fun);
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

function ConfirmHelper({ title, text, fun }) {
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

export function AddButton({ tooltip, tooltipPlacement = "bottom", fun, ssr }) {
  if (ssr) {
    return null;
  }
  return (
    <Tooltip title={tooltip} placement={tooltipPlacement}>
      <Fab color="primary" size="small" onClick={fun}>
        <Add />
      </Fab>
    </Tooltip>
  );
}

export function DeleteButton({ title, text, tooltip, fun }) {
  const confirmDelete = ConfirmHelper({
    title,
    text,
    fun,
  });
  return (
    <div>
      <Tooltip title={tooltip}>
        <Fab color="secondary" size="small" {...confirmDelete.elementProps}>
          <Delete />
        </Fab>
      </Tooltip>
      {confirmDelete.dialog}
    </div>
  );
}

export class Editor extends React.Component {
  constructor(props, updateWith, fields = null) {
    super(props);
    this.state = _.cloneDeep(props.object);
    if (fields) {
      this.state = _.pick(this.state, fields);
    }
    this.props.onClose(() => {
      let obj = {};
      for (let attr in this.state) {
        if (this.props.object[attr] !== this.state[attr]) {
          obj[attr] = this.state[attr];
        }
      }
      if (_.size(obj)) {
        this.props.send({ ...updateWith, ...obj });
      }
    });
  }
}
