import React from "react";

import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { GetIconComponent } from "@openimis/fe-core";
const Person = GetIconComponent("Person")

import { useModulesManager, useTranslations, useHistory, historyPush } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const StyledInsureeProfileLink = styled('div')(({ theme }) => ({
  '& .label': {
    marginLeft: "8px",
  },
}));

const InsureeProfileLink = ({ insureeUuid }) => {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME);

  const goToInsureeProfile = (modulesManager, history, uuid, showInAnotherTab = false) =>
    historyPush(modulesManager, history, "insuree.route.insureeProfile", [uuid], showInAnotherTab);

  return (
    <StyledInsureeProfileLink>
      <Button
        variant="contained"
        color="primary"
        onClick={() => goToInsureeProfile(modulesManager, history, insureeUuid)}
      >
        <Person />
        <span className="label"> {formatMessage("insureeSummaries.goToTheProfile")} </span>
      </Button>
    </StyledInsureeProfileLink>
  );
};

export default InsureeProfileLink;
