import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { TableContainer, TableHead, TableBody, Table, TableCell, TableRow, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import { useModulesManager, ProgressOrError, useTranslations } from "@openimis/fe-core";
import { fetchFamilyMembers } from "../actions";
import { HYPHEN, MODULE_NAME } from "../constants";

const useStyles = makeStyles((theme) => ({
  footer: {
    marginInline: 16,
    marginBlock: 12,
  },
  headerTitle: theme.table.title,
  actionCell: {
    width: 60,
  },
  header: theme.table.header,
}));

const FAMILY_MEMBERS_HEADERS = ["FamilyMembersTable.NSHI", "FamilyMembersTable.memberName", "FamilyMembersTable.phone"];

const FamilyMembersTable = () => {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const { fetchingFamilyMembers, familyMembers, errorFamilyMembers, insuree } = useSelector((store) => store.insuree);

  useEffect(() => {
    if (!insuree) return;

    dispatch(fetchFamilyMembers(modulesManager, [`familyUuid: "${insuree.family.uuid}"`]));
  }, [insuree]);

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead className={classes.header}>
          <TableRow className={classes.headerTitle}>
            {FAMILY_MEMBERS_HEADERS.map((header) => (
              <TableCell key={header}> {formatMessage(header)} </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <ProgressOrError progress={fetchingFamilyMembers} error={errorFamilyMembers} />
          {familyMembers?.map((familyMember) => (
            <TableRow key={familyMember?.uuid}>
              <TableCell> {familyMember?.chfId} </TableCell>
              <TableCell> {`${familyMember?.otherNames} ${familyMember?.lastName}`} </TableCell>
              <TableCell> {familyMember?.phone ?? HYPHEN} </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FamilyMembersTable;
