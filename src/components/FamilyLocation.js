import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import {
  PublishedComponent,
  ProgressOrError,
  SelectInput,
  businessObjectNodeId,
  getUserBusinessAccessesOf,
  useCurrentUser,
  useGraphqlQuery,
  useHasPerms,
  useModulesManager,
  useTranslations,
} from "@openimis/fe-core";
import { RIGHT_FAMILY_ADD, RIGHT_FAMILY_EDIT, UBA_LINK_TYPE_ENROLMENT } from "../constants";

const useStyles = makeStyles((theme) => ({
  item: theme.paper.item,
}));

const LOCATION_GQL_TYPE = "LocationGQLType";
const NO_VILLAGE_QUERY = "query EnrolmentVillages { __typename }";

/** The location and its ancestors, the top level (region) first. */
const locationPath = (location) => {
  const path = [];
  for (let current = location; !!current; current = current.parent) {
    path.unshift(current);
  }
  return path;
};

const locationLabel = (location) => (!location ? "" : [location.code, location.name].filter(Boolean).join(" "));

/**
 * One query reading back the villages the user holds the ENROLMENT credential on, with
 * their ancestors: an aliased relay `node` per village, as the core business object
 * registry does, with the full location projection (the one a family's location has).
 */
const formatVillagesQuery = (modulesManager, villageIds) => {
  const fields = villageIds
    .map((villageId) => businessObjectNodeId(LOCATION_GQL_TYPE, villageId))
    .filter(Boolean)
    .map(
      (nodeId, idx) =>
        `village${idx}: node(id: "${nodeId}") { ... on ${LOCATION_GQL_TYPE} ${modulesManager.getProjection(
          "location.Location.FlatProjection",
        )} }`,
    );
  if (!fields.length) return null;
  return `query EnrolmentVillages {\n  ${fields.join("\n  ")}\n}`;
};

/**
 * The location of a family: `location.DetailedLocation`, except for an enrolment officer
 * whose family right is granted only on their villages (UBA bag, through an ENROLMENT
 * link).
 *
 * For them the choice is restricted to the villages they are linked to: each level only
 * offers the ancestors of those villages (region, district, ward), the village level
 * those villages, and a level with a single option is preselected - so an officer linked
 * to one village gets it, and its whole path, filled in.
 *
 * This is only what the form offers: the backend scopes the location queries and checks
 * the village on the mutation. When the villages cannot be read back, the standard picker
 * is shown instead.
 */
const FamilyLocation = (props) => {
  const { value, onChange, readOnly = false, required = false, family, ...others } = props;
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("location", modulesManager);

  // the links are loaded apart from the user (`core.Boot`): subscribe to both, so that the
  // restriction applies as soon as they are there
  const user = useCurrentUser();
  const userBusinessAccesses = useSelector((state) => state.core?.userBusinessAccesses);
  const links = useMemo(
    () => getUserBusinessAccessesOf(user, UBA_LINK_TYPE_ENROLMENT),
    [user, userBusinessAccesses],
  );
  // a user holding the right globally may put the family anywhere
  const holdsGlobally = useHasPerms(family?.uuid ? RIGHT_FAMILY_EDIT : RIGHT_FAMILY_ADD);
  const restricted = !readOnly && !holdsGlobally && links.length > 0;

  const villageIds = restricted ? links.map((link) => link.objectId).filter(Boolean) : [];
  const villagesKey = JSON.stringify(villageIds);
  const query = useMemo(() => formatVillagesQuery(modulesManager, villageIds), [villagesKey, modulesManager]);
  const { data, isLoading, error } = useGraphqlQuery(query ?? NO_VILLAGE_QUERY, undefined, {
    skip: !query,
    keepStale: true,
  });

  // the villages and their paths, the ones sharing a uuid once
  const paths = useMemo(() => {
    if (!query || !data) return [];
    const seen = new Set();
    return Object.keys(data)
      .filter((alias) => alias.startsWith("village") && !!data[alias]?.uuid)
      .map((alias) => data[alias])
      .filter((village) => (seen.has(village.uuid) ? false : seen.add(village.uuid)))
      .map(locationPath);
  }, [data, query]);
  const levels = paths.reduce((max, path) => Math.max(max, path.length), 0);

  // the uuids picked, level by level
  const [picked, setPicked] = useState(() => locationPath(value).map((l) => l.uuid));
  const touched = useRef(false);

  // the picked path, completed by the levels that have one option only
  const { selection, optionsByLevel } = useMemo(() => {
    const selection = [];
    const optionsByLevel = [];
    let candidates = paths;
    for (let level = 0; level < levels; level++) {
      const options = [];
      candidates.forEach((path) => {
        if (!!path[level] && !options.find((o) => o.uuid === path[level].uuid)) options.push(path[level]);
      });
      optionsByLevel.push(options);
      const chosen = options.find((o) => o.uuid === picked[level]) ?? (options.length === 1 ? options[0] : null);
      selection.push(chosen);
      if (!chosen) break;
      candidates = candidates.filter((path) => path[level]?.uuid === chosen.uuid);
    }
    return { selection, optionsByLevel };
  }, [paths, levels, picked]);

  const selectedVillage = selection.length === levels ? selection[levels - 1] : null;

  // the family's location changed from outside (loaded, reset): follow it
  useEffect(() => {
    if (!!value?.uuid && value.uuid !== selectedVillage?.uuid) {
      setPicked(locationPath(value).map((l) => l.uuid));
    }
  }, [value?.uuid]);

  // a village picked (or preselected): it is the family's location
  useEffect(() => {
    if (!restricted || !paths.length) return;
    if (!!selectedVillage) {
      if (selectedVillage.uuid !== value?.uuid) onChange(selectedVillage);
    } else if (touched.current && !!value) {
      onChange(null);
    }
  }, [restricted, paths, selectedVillage?.uuid]);

  const onLevelChange = (level, uuid) => {
    touched.current = true;
    setPicked([...selection.slice(0, level).map((l) => l?.uuid), uuid || null]);
  };

  if (!restricted || (!isLoading && (!!error || !paths.length))) {
    return (
      <PublishedComponent
        pubRef="location.DetailedLocation"
        withNull={true}
        readOnly={readOnly}
        required={required}
        value={value}
        onChange={onChange}
        filterLabels={false}
        {...others}
      />
    );
  }
  if (!paths.length) return <ProgressOrError progress={isLoading} error={error} />;
  return (
    <Grid container>
      {optionsByLevel.map((options, level) => (
        <Grid item xs={Math.max(Math.floor(12 / levels), 1)} className={classes.item} key={`enrolment-location-${level}`}>
          <SelectInput
            module="location"
            strLabel={formatMessage(`locationType.${level}`)}
            options={options.map((l) => ({ value: l.uuid, label: locationLabel(l) }))}
            value={selection[level]?.uuid ?? null}
            required={required}
            onChange={(uuid) => onLevelChange(level, uuid)}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default FamilyLocation;
