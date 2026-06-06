import React from "react";
import { styled } from "@mui/material/styles";
import { Avatar, Grid, IconButton } from "@mui/material";
import { toISODate, useModulesManager, useTranslations, PublishedComponent } from "@openimis/fe-core";
import _ from "lodash";
import moment from "moment";

const StyledInsureeAvatar = styled('div')(({ theme }) => ({
  '& .bigAvatar': theme?.bigAvatar ?? {},
  '& .hiddenInput': {
    display: "none",
  },
  '& .item': {
    ...(theme?.paper?.item ?? {}),
    paddingInline: 0,
  },
}));

const InsureeAvatar = (props) => {
  const { photo, className, withMeta = false, readOnly, onChange } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);

  const getUrl = (photo) => {
    if (photo?.photo) {
      return `data:image/png;base64,${photo.photo}`;
    }
    if (photo?.filename) {
      return `/photos/${photo.folder}/${photo.filename}`;
    }
    return null;
  };

  const onFileSelect = (event) => {
    if (!!event.target.files) {
      const file = event.target.files[0];
      var reader = new FileReader();
      reader.onloadend = (loaded) => {
        onChange({
          ...photo,
          folder: null,
          filename: null,
          photo: btoa(loaded.target.result),
          date: toISODate(moment().toDate()),
        });
      };
      reader.readAsBinaryString(file);
    }
  };

  const isRequired = Boolean(photo?.thumbnail || photo?.photo);
  return (
    <StyledInsureeAvatar>
      <Grid container className={className} direction="row" wrap="nowrap" spacing={1}>
        <div>
          <IconButton
            variant="contained"
            component="label"
            size="small"
            edge="start"
            style={{ cursor: readOnly ? "default" : "pointer" }}
          >
            <Avatar src={getUrl(photo)} className="bigAvatar" />
            <input
              type="file"
              disabled={readOnly}
              className="hiddenInput"
              onChange={onFileSelect}
              accept="image/*"
            />
          </IconButton>
        </div>
        {withMeta && (
          <Grid container direction="column">
            <Grid className="item">
              <PublishedComponent
                pubRef="core.DatePicker"
                value={photo?.date}
                module="insuree"
                label="Insuree.photoDate"
                readOnly={readOnly}
                required={isRequired}
                onChange={(date) => onChange({ ...photo, date })}
              />
            </Grid>
            <Grid className="item">
              <PublishedComponent
                pubRef="insuree.InsureeOfficerPicker"
                value={photo?.officerId}
                module="insuree"
                label={formatMessage("Insuree.photoOfficer")}
                readOnly={readOnly}
                required={isRequired}
                onChange={(v) => onChange({ ...photo, officerId: v?.id })}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </StyledInsureeAvatar>
  );
};

export default InsureeAvatar;
