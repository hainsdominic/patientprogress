/*eslint-disable*/
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
// @material-ui/core components
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Icon from '@material-ui/core/Icon';
import LanguageIcon from '@material-ui/icons/Language';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import styles from '../../assets/jss/material-dashboard-react/components/sidebarStyle.js';
import { logout } from '../../actions/auth';
import { setAlert } from '../../actions/alert';

const useStyles = makeStyles(styles);

const Sidebar = (props) => {
  const classes = useStyles();
  let location = useLocation();

  const { t, i18n } = useTranslation();

  const getOtherLang = () => {
    return i18n.language === 'en' ? 'Français' : 'English';
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };

  // verifies if routeName is the one active (in browser input)
  function activeRoute(routeName) {
    return location.pathname === routeName;
  }
  const { color, logo, image, logoText, routes } = props;
  var links = (
    <List className={classes.list}>
      {routes.map((prop, key) => {
        var activePro = ' ';
        var listItemClasses;
        listItemClasses = classNames({
          [' ' + classes[color]]: activeRoute(prop.layout + prop.path),
        });

        const whiteFontClasses = classNames({
          [' ' + classes.whiteFont]: activeRoute(prop.layout + prop.path),
        });
        return (
          <NavLink
            to={prop.layout + prop.path}
            className={activePro + classes.item}
            activeClassName="active"
            key={key}
          >
            <ListItem button className={classes.itemLink + listItemClasses}>
              {typeof prop.icon === 'string' ? (
                <Icon
                  className={classNames(classes.itemIcon, whiteFontClasses)}
                >
                  {prop.icon}
                </Icon>
              ) : (
                <prop.icon
                  className={classNames(classes.itemIcon, whiteFontClasses)}
                />
              )}
              <ListItemText
                primary={t(`sidebar.${prop.name}`)}
                className={classNames(classes.itemText, whiteFontClasses)}
                disableTypography={true}
              />
            </ListItem>
          </NavLink>
        );
      })}
      {routes[0].layout === '' && (
        <NavLink
          className={' ' + classes.item}
          onClick={() => toggleLanguage()}
          to="#"
        >
          <ListItem button className={classes.itemLink}>
            <LanguageIcon className={classes.itemIcon} />
            <ListItemText
              primary={getOtherLang()}
              className={classes.itemText}
              disableTypography={true}
            />
          </ListItem>
        </NavLink>
      )}
      {(routes[0].layout === '/patient' ||
        routes[0].layout === '/professional' ||
        routes[0].layout === '/admin') && (
        <NavLink
          className={' ' + classes.item}
          onClick={() => props.logout()}
          to={'/'}
        >
          <ListItem button className={classes.itemLink}>
            <ExitToAppIcon className={classes.itemIcon} />
            <ListItemText
              primary={t('sidebar.logout')}
              className={classes.itemText}
              disableTypography={true}
            />
          </ListItem>
        </NavLink>
      )}
    </List>
  );
  var brand = (
    <div className={classes.logo}>
      <a href="/" className={classNames(classes.logoLink)}>
        <div className={classes.logoImage}>
          <img src={logo} alt="logo" className={classes.img} />
        </div>
        {logoText}
      </a>
    </div>
  );
  return (
    <div>
      <Hidden mdUp implementation="css">
        <Drawer
          variant="temporary"
          anchor={'right'}
          open={props.open}
          classes={{
            paper: classNames(classes.drawerPaper),
          }}
          onClose={props.handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {brand}
          <div className={classes.sidebarWrapper}>{links}</div>
          {image !== undefined ? (
            <div
              className={classes.background}
              style={{ backgroundImage: 'url(' + image + ')' }}
            />
          ) : null}
        </Drawer>
      </Hidden>
      <Hidden smDown implementation="css">
        <Drawer
          anchor="left"
          variant="permanent"
          open
          classes={{
            paper: classNames(classes.drawerPaper),
          }}
        >
          {brand}
          <div className={classes.sidebarWrapper}>{links}</div>
          {image !== undefined ? (
            <div
              className={classes.background}
              style={{ backgroundImage: 'url(' + image + ')' }}
            />
          ) : null}
        </Drawer>
      </Hidden>
    </div>
  );
};

Sidebar.propTypes = {
  handleDrawerToggle: PropTypes.func,
  bgColor: PropTypes.oneOf(['purple', 'blue', 'green', 'orange', 'red']),
  logo: PropTypes.string,
  image: PropTypes.string,
  logoText: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object),
  open: PropTypes.bool,
  logout: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
};

export default connect(null, { setAlert, logout })(Sidebar);
