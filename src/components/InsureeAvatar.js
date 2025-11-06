import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Avatar, Grid, IconButton, Typography, TextField } from "@material-ui/core";
import { toISODate, useModulesManager, useTranslations, PublishedComponent } from "@openimis/fe-core";
import _ from "lodash";
import moment from "moment";
import { loadCurrentUser } from "../utils/utils";
import { useDispatch } from "react-redux";

const styles = (theme) => ({
  bigAvatar: theme.bigAvatar,
  hiddenInput: {
    display: "none",
  },
  item: {
    ...theme.paper.item,
    paddingInline: 0,
  },
});

const InsureeAvatar = (props) => {
  const { photo, classes, className, withMeta = false, readOnly, onChange, required } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);
  const dispatch = useDispatch();
  
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isEnrollmentOfficer, setIsEnrollmentOfficer] = React.useState(false);
  const isCreateMode = !photo || (!photo.photo && !photo.filename);
  
  React.useEffect(() => {
    if (isCreateMode && !readOnly) {
      
      loadCurrentUser(dispatch).then((response) => {
        if (response && response.payload) {
          const data = response.payload;
          const username = data.username;
          const userType = data.i_user ? 'i_user' : data.t_user ? 't_user' : 'unknown';
          
          // is enrollment officer ??
          const isOfficer = data.i_user !== null && data.i_user !== undefined;
          setIsEnrollmentOfficer(isOfficer);
                    
          setCurrentUser({
            username: username,
            userId: data.i_user?.id || data.t_user?.id,
            fullData: data
          });
          
          if (isOfficer && data.i_user?.id) {
            onChange({ ...photo, officerId: data.i_user.id });
          }
        }
      }).catch(error => {
        console.error(error);
      });
    }
  }, [isCreateMode, readOnly, dispatch]);

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

  const isRequired = Boolean(photo?.thumbnail || photo?.photo) || required;
  return (
    <Grid container className={className} direction="row" wrap="nowrap" spacing={1}>
      <div>
        <IconButton
          variant="contained"
          component="label"
          size="small"
          edge="start"
          style={{ cursor: readOnly ? "default" : "pointer" }}
        >
          <Avatar src={getUrl(photo)} className={classes.bigAvatar} />
          <input
            type="file"
            disabled={readOnly}
            className={classes.hiddenInput}
            onChange={onFileSelect}
            accept="image/*"
          />
        </IconButton>
      </div>
      {withMeta && (
        <Grid container direction="column" item>
          <Grid item className={classes.item}>
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
          <Grid item className={classes.item}>
            {isCreateMode && !readOnly && isEnrollmentOfficer ? (
              <TextField
                fullWidth
                disabled
                label={formatMessage("Insuree.photoOfficer")}
                value={currentUser?.username || "Loading..."}
                variant="outlined"
                size="small"
              />
            ) : (
              <PublishedComponent
                pubRef="insuree.InsureeOfficerPicker"
                value={photo?.officerId}
                module="insuree"
                label={formatMessage("Insuree.photoOfficer")}
                readOnly={readOnly}
                required={isRequired}
                onChange={(v) => onChange({ ...photo, officerId: v?.id })}
              />
            )}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default withTheme(withStyles(styles)(InsureeAvatar));