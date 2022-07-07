import "./App.css";
import * as React from "react";
import Button from "@mui/material/Button";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import DataTable from "./components/table";
import Upload from "./components/upload";
import { useRecoilState } from "recoil";
import { uploadDialogState } from "./recoil/atoms";
import { Typography } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#8aa12f",
    },
  },
} as any);

function App() {
  const [, setOpen] = useRecoilState(uploadDialogState);

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Upload />
        <header className="App-header">
          <a href="/">
            <img src="logo.svg" alt="logo" />
          </a>
          <Button
            onClick={() => setOpen(true)}
            variant="outlined"
            style={{ float: "right" }}
          >
            Publish new Module
          </Button>
        </header>
        <Typography sx={{ p: 5 }}>
          A published list of public WASM modules available on Filecoin
        </Typography>
        <DataTable />
      </div>
    </ThemeProvider>
  );
}

export default App;
