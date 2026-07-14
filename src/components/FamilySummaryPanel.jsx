import React from "react";
import { injectIntl } from "react-intl";
import { styled } from "@mui/material/styles";
import { Paper, Table, TableBody, TableCell, TableRow, Typography, Box } from "@mui/material";
import { useTranslations, useModulesManager } from "@openimis/fe-core";


const StyledPaper = styled(Paper)(({ theme }) => ({
  ...theme.paper?.paper ?? {
    marginTop: theme.spacing(2),
  },
  '& .header': {
    padding: theme.spacing(1),
    backgroundColor: theme.paper.header.backgroundColor,
  },
  '& .table': {
    minWidth: 300,
    '& .MuiTableCell-root': {
      borderBottom: 'none',
      padding: theme.spacing(1, 2),
    },

    '& .divider': {
      borderTop: `1px solid ${theme.palette.divider}`,
      margin: theme.spacing(1, 0),
    },
    '& .totalLabel': {
      width: '79%',
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    '& .totalValue': {
      textAlign: 'left',
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    '& .balanceRow': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const FamilySummaryPanel = ({
  classes,
  totalPoliciesAmount = 0,
  totalContributions = 0,
}) => {
  const modulesManager = useModulesManager();
  const { formatMessage, formatAmount } = useTranslations("insuree", modulesManager);

  // Calcul de la balance (différence entre le total des polices et le total des contributions)
  const balance = totalPoliciesAmount - totalContributions;

  return (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" className="header">
        <Typography variant="h6">
          {formatMessage("familyAmountsSummary")}
        </Typography>
      </Box>
      <Table className="table" size="small">
        <TableBody>
          <TableRow>
            <TableCell className="totalLabel">
              {formatMessage("totalPoliciesAmount")}:
            </TableCell>
            <TableCell className="totalValue">
              {formatAmount(totalPoliciesAmount)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="totalLabel">
              {formatMessage("totalContributions")}:
            </TableCell>
            <TableCell className="totalValue">
              {formatAmount(totalContributions)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell colSpan={2} className="divider" />
          </TableRow>

          <TableRow className="balanceRow">
            <TableCell className="totalLabel">
              <strong>{formatMessage("balance")}:</strong>
            </TableCell>
            <TableCell className="totalValue">
              <strong>{formatAmount(balance)}</strong>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </StyledPaper>
  );
};


export { StyledPaper };
export default injectIntl(FamilySummaryPanel);