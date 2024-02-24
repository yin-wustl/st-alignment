import React, { FC } from 'react';
import { Outlet, Link, useNavigate } from "react-router-dom";
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import HelpIcon from '@mui/icons-material/Help';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import TuneIcon from '@mui/icons-material/Tune';
import CalculateIcon from '@mui/icons-material/Calculate';
import PreviewIcon from '@mui/icons-material/Preview';

import { MenuProps } from './Menu.lazy';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const Menu: FC<MenuProps> = (MenuProps) => {
  const theme = useTheme();
  const slices = MenuProps.slices;
  const computed = MenuProps.computed;
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('Home');

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const navigation = useNavigate();
  const handleNavigation = (path: string) => { navigation(path); }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            id="open-menu"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton id="close-menu" onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem key="home" disablePadding sx={{ display: 'block' }} onClick={e => { setTitle("Home"); handleNavigation("/"); }} >
            <ListItemButton sx={{ minHeight: 48, px: 2.5 }} >
              <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
          <ListItem key="help" disablePadding sx={{ display: 'block' }} onClick={e => { setTitle("Help"); handleNavigation("/help"); }}>
            <ListItemButton sx={{ minHeight: 48, px: 2.5 }} >
              {/* <Link to="/help" /> */}
              <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="Help" />
            </ListItemButton>
          </ListItem>
          <ListItem key="upload" disablePadding sx={{ display: 'block' }} onClick={e => { setTitle("Upload"); handleNavigation("/import"); }}>
            <ListItemButton sx={{ minHeight: 48, px: 2.5 }} >
              <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                <CloudUploadIcon />
              </ListItemIcon>
              <ListItemText primary="Load Images" />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          {slices.length ? (
            <ListItem key={0} disablePadding sx={{ display: 'block' }} onClick={e => { setTitle("Alignment"); handleNavigation("/alignment"); }}>
              <ListItemButton sx={{ minHeight: 48, px: 2.5 }} >
                <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                  <TuneIcon />
                </ListItemIcon>
                <ListItemText primary={"Alignment"} />
              </ListItemButton>
            </ListItem>
          ) : null}
          {/* {[...new Array(Math.max(slices.length - 1, 0))].map((s, i) => {
            const title = "Alignment " + String(i + 1) + " and " + String(i + 2);
            const longTitle = "Alignment " + slices[i].name + " and " + slices[i + 1].name;
            return (
              <ListItem key={i} disablePadding sx={{ display: 'block' }} onClick={e => { setTitle(longTitle); handleNavigation(`/alignment-${i + 1}-and-${i + 2}`); }}>
                <ListItemButton sx={{ minHeight: 48, px: 2.5 }} disabled >
                  <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                    <AdsClickIcon />
                  </ListItemIcon>
                  <ListItemText primary={title} />
                </ListItemButton>
              </ListItem>
            );
          })} */}
        {/* </List>
        <Divider />
        <List> */}
          <ListItem key="compute" disablePadding sx={{ display: 'block' }} onClick={e => { setTitle("Compute"); handleNavigation("/compute"); }}>
            <ListItemButton sx={{ minHeight: 48, px: 2.5 }} >
              <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                <CalculateIcon />
              </ListItemIcon>
              <ListItemText primary="Compute" />
            </ListItemButton>
          </ListItem>
          {/* {[...new Array(Math.max(slices.length - 1, 0))].map((s, i) => {
            const title = "Preview " + String(i + 1) + " and " + String(i + 2);
            const longTitle = "Preview " + slices[i].name + " and " + slices[i + 1].name;
            return (
              <ListItem key={i} disablePadding sx={{ display: 'block' }} onClick={e => { setTitle(longTitle); handleNavigation(`/preview-${i + 1}-and-${i + 2}`); }}>
                <ListItemButton sx={{ minHeight: 48, px: 2.5 }} disabled={!computed} >
                  <ListItemIcon sx={{ minWidth: 0, mr: 3 }}>
                    <PreviewIcon />
                  </ListItemIcon>
                  <ListItemText primary={title} />
                </ListItemButton>
              </ListItem>
            );
          })} */}
        </List>

      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Menu;
