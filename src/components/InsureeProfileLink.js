import React from "react";

import { Tooltip, IconButton } from "@material-ui/core";
import { Person } from "@material-ui/icons";

import { useModulesManager, useTranslations, useHistory, historyPush } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const InsureeProfileLink = ({ insureeUuid }) => {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME);

  const goToInsureeProfile = (modulesManager, history, uuid, showInAnotherTab = false) =>
    historyPush(modulesManager, history, "insuree.route.insureeProfile", [uuid], showInAnotherTab);

  return (
    <Tooltip title={formatMessage("insureeSummaries.goToTheProfile")}>
      <IconButton onClick={() => goToInsureeProfile(modulesManager, history, insureeUuid)}>
        <Person />
      </IconButton>
    </Tooltip>
  );
};

export default InsureeProfileLink;
