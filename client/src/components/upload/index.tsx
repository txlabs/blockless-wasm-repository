import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useRecoilState } from "recoil";
import { uploadDialogState, moduleListState } from "../../recoil/atoms";
import axios from "axios";
import UploadButton from "../interactivebutton";

export default function FormDialog() {
  const [open, setOpen] = useRecoilState(uploadDialogState);
  const [functionList, setFunctionlist] = useRecoilState(moduleListState);

  const handleClose = () => {
    setOpen(false);
  };

  const host = process.env.PRODUCTION ? "" : "http://localhost:3005";
  const handlePublish = (cb: any) => {
    var formData = new FormData();
    var manifest: any = document.querySelector("#manifest");
    var wasiArchive: any = document.querySelector("#wasi_archive");

    formData.append("manifest", manifest.files[0]);
    formData.append("wasi_archive", wasiArchive.files[0]);

    axios
      .post(`${host}/api/submit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        cb(res.data);
        axios.get(`${host}/api/list`).then((res) => {
          setFunctionlist(res.data);
        });
      });
  };

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Publish WASM Module</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Quickly submit a new WASM module to an IPFS store.
          </DialogContentText>
          <TextField
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            id="manifest"
            name="manifest"
            label="Manifest"
            type="file"
            fullWidth
            variant="outlined"
          />
          <TextField
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            id="wasi_archive"
            name=""
            label="WASI Archive"
            type="file"
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="error">
            Cancel
          </Button>
          <UploadButton onClick={handlePublish} />
        </DialogActions>
      </Dialog>
    </div>
  );
}
