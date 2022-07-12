import * as React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import axios from "axios";
import { useRecoilState } from "recoil";
import { moduleListState } from "../../recoil/atoms";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "rgb(63, 59, 59)",
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const host =
  process.env.NODE_ENV === "development" ? "http://localhost:3005" : "";
export default function CustomizedTables() {
  const [functionList, setFunctionlist] = useRecoilState(moduleListState);

  React.useEffect(() => {
    if (functionList.length === 0) {
      axios.get(`${host}/api/list`).then((res) => {
        setFunctionlist(res.data);
      });
    }
  });

  return (
    <TableContainer
      sx={{ mt: 5, width: "95%", mr: "auto", ml: "auto" }}
      component={Paper}
    >
      <Table aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>Module Name</StyledTableCell>
            <StyledTableCell align="right">Created On</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {functionList.map((row: any, index: number) => (
            <StyledTableRow key={index}>
              <StyledTableCell component="th" scope="row">
                {row.name}
              </StyledTableCell>
              <StyledTableCell align="right">{row.created}</StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
