import * as React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { green } from "@mui/material/colors";
import Button from "@mui/material/Button";
import { useRecoilState } from "recoil";
import { uploadDialogState } from "../../recoil/atoms";

export default function CircularIntegration(props: any) {
  const [loading, setLoading] = React.useState(false);
  const [, setSuccess] = React.useState(false);
  const [, setOpen] = useRecoilState(uploadDialogState);
  const timer = React.useRef<number>();

  React.useEffect(() => {
    return () => {
      clearTimeout((timer as any).current);
    };
  }, []);

  const handleButtonClick = () => {
    if (!loading) {
      setSuccess(false);
      setLoading(true);
      props.onClick(() => {
        setSuccess(true);
        setLoading(false);
        setOpen(false);
      });
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ m: 1, position: "relative" }}>
        <Button
          variant="outlined"
          disabled={loading}
          onClick={handleButtonClick}
        >
          Publish
        </Button>
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              color: green[500],
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-12px",
              marginLeft: "-12px",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
