import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { TableContainer, TableHead, TableBody, Table, TableCell, TableRow, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import { useModulesManager, ProgressOrError } from "@openimis/fe-core";
import { fetchFamilyMembers } from "../actions";

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

const FamilyMembersTable = () => {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const { fetchingInsuree, insuree, errorInsuree } = useSelector((store) => store.insuree);

  useEffect(() => {
    if (!insuree) return;

    dispatch(fetchFamilyMembers(modulesManager, [`familyUuid: "${insuree.family.uuid}"`]));
  }, [insuree]);

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <ProgressOrError progress={fetchingInsuree} error={errorInsuree} />
        <TableHead className={classes.header}>
          <TableRow className={classes.headerTitle}>
            <TableCell> NSHI </TableCell>
            <TableCell> MEMBER NAME </TableCell>
            <TableCell> PHONE </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* //! Map family members */}
          {/* {items.map((item) => (
            <TableRow key={item.parent?.id}>
              <TableCell>

              </TableCell>
              <TableCell>
                <PublishedComponent
                  fullWidth
                  pubRef="location.LocationPicker"
                  parentLocation={item.parent}
                  parentLocations={[item.parent?.uuid]}
                  readOnly={readOnly}
                  required
                  multiple
                  value={item.entities}
                  onChange={(value) => onVillagesChange(item, value)}
                  filterOptions={filterVillages}
                  locationLevel={3}
                />
              </TableCell>
              <TableCell className={classes.actionCell}>
                <IconButton disabled={readOnly} onClick={() => onRemoveRow(item)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))} */}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FamilyMembersTable;
