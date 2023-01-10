import React, { memo, useCallback, useEffect, useMemo } from 'react';

import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import MuiDrawer from '@mui/material/Drawer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Container from '@mui/material/Container';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

import Divider from '@mui/material/Divider';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {TopSideBarButtons} from './top-sidebar-buttons';
import { shallowEqual, useStore } from 'react-redux';
import {ReduxState, useAppDispatch, useAppSelector} from '@reducers'
import { openSidebar } from '@reducers/misc';
import Grid from '@mui/material/Grid';
import WideAppBarContent from './wide-app-bar-content';
import { FileTransferListDrawer } from './file-transfer-list-drawer';
import DrawerCommon from './drawer-common';
import BottomSidebarButtons from './bottom-sidebar-buttons';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from "@mui/material";
import { useRouter } from 'next/router';
import NarrowAppBarContent from './narrow-app-bar-content';
import WebsocketOfflineTooLongDialog from './ws-offline-too-long-dialog';

const drawerWidth: number = 240;

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const WideAppBar = styled(MuiAppBar, {
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
  
const WideDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        '& .MuiDrawer-paper': {
            position: 'relative',
            whiteSpace: 'nowrap',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
            }),
            boxSizing: 'border-box',
            ...(!open && {
                overflowX: 'hidden',
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                width: theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    width: theme.spacing(9),
                },
            }),
        },
    }),
);

const NarrowAppBar = styled(MuiAppBar, {
        shouldForwardProp: (prop) => prop !== 'open',
    })<AppBarProps>(({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        // width: `calc(100% - ${drawerWidth}px)`,
        // marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const NarrowDrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));

const 
    Layout = memo((
        {
            children,
            userRight=15,
        }:{
            children:JSX.Element;
            userRight?:number;
        }
    ) => {
        const 
            systemDark = useAppSelector(state => state.misc.systemDark,shallowEqual),
            userMode = useAppSelector(state => state.misc.userMode,shallowEqual),
            theme = useMemo(()=>createTheme(
                !!userMode && systemDark !== null ? {palette: {mode: userMode === 'system' ? (systemDark ? 'dark' : 'light') : userMode}} : {}
            ),[systemDark,userMode])

        return (
            <>
            {!!userMode && systemDark !== null && <ThemeProvider theme={theme}>
                <CssBaseline />
                <LayoutWrapper {...{userRight}}>{children}</LayoutWrapper>
            </ThemeProvider>}
            </>
        )
    }),
    LayoutWrapper = memo((
        {
            children,
            userRight=15,
        }:{
            children:JSX.Element;
            userRight?:number;
        }
    )=>{
        const
            {breakpoints:{values:{sm},up},palette:{mode}} = useTheme(),
            matchesSM = useMediaQuery(up('sm')),
            store = useStore(),
            dispatch = useAppDispatch(),
            {pathname} = useRouter(),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen)

        useEffect(()=>{
            const docBody = document.body
            if (mode==='light' && docBody.classList.contains('body-dark')) docBody.classList.remove('body-dark')
            else if (mode==='dark' && !docBody.classList.contains('body-dark')) docBody.classList.add('body-dark')
        },[mode])

        useEffect(()=>{
            if (window.innerWidth > sm){
                const menuOpen = localStorage.getItem('menuOpen')
                dispatch(openSidebar(menuOpen==='true' || !menuOpen))
                if (!menuOpen) localStorage.setItem('menuOpen','true')
            } else dispatch(openSidebar(false))
        },[pathname])

        useEffect(()=>{
            if (matchesSM) {
                const open = (store.getState() as ReduxState).misc.sidebarOpen
                if (open !== null){
                    const menuOpen = localStorage.getItem('menuOpen')
                    dispatch(openSidebar(menuOpen==='true' || !menuOpen))
                }
            }
            else dispatch(openSidebar(false))
        },[matchesSM])

            
        return (
            <>
            {sidebarOpen !== null && <LayoutContent {...{userRight}}>{children}</LayoutContent>}
            </>
        )
    }),
    LayoutContent = memo((
        {
            children,
            userRight=15,
        }:{
            children:JSX.Element;
            userRight?:number;
        }
    )=>{
        const 
            {breakpoints:{up},direction,palette:{mode,grey},transitions} = useTheme(),
            matchesSM = useMediaQuery(up('sm')),
            matchesMD = useMediaQuery(up('md')),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            loading = useAppSelector(state => state.misc.loading),
            open = useAppSelector(state => state.misc.sidebarOpen),
            dispatch = useAppDispatch(),
            onOpen = useCallback(() => {
                if (matchesSM) localStorage.setItem('menuOpen',(true).toString())
                dispatch(openSidebar(true))
            },[matchesSM]),
            onClose = useCallback(() => {
                if (matchesSM) localStorage.setItem('menuOpen',(false).toString())
                dispatch(openSidebar(false))
            },[matchesSM])

        return (
            <>
            <Box sx={{ display: 'flex' }}>
                {matchesSM && <>
                <WideAppBar position="absolute" open={open}>
                    <Toolbar sx={{pr:'8px !important'}}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={onOpen}
                            sx={{
                                marginRight: '36px',
                                ...(open && { display: 'none' }),
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        {(!matchesMD && sidebarOpen) ? <NarrowAppBarContent /> : <WideAppBarContent />}
                    </Toolbar>
                </WideAppBar>
                <WideDrawer variant="permanent" open={open}>
                    <Toolbar
                        sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        px: [1],
                        }}
                    >
                        <IconButton onClick={onClose}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </Toolbar>
                    <DrawerContent {...{userRight}} />
                </WideDrawer>
                </>}
                {!matchesSM && <>
                <NarrowAppBar position="fixed" open={open}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={onOpen}
                            edge="start"
                            sx={{ ...(open && { display: 'none' }) }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <NarrowAppBarContent />
                    </Toolbar>
                </NarrowAppBar>
                <DrawerCommon {...{
                    open,
                    onClose,
                    onOpen,
                    anchor:'left',
                    sx:{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                        },
                    }
                }}>
                    <>
                    <NarrowDrawerHeader>
                        <IconButton onClick={onClose}>
                            {direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                        </IconButton>
                    </NarrowDrawerHeader>
                    <Divider />
                    <DrawerContent {...{userRight}} />
                    </>
                </DrawerCommon>
                </>}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        height: 'var(--viewport-height)',
                        overflow: 'auto',
                        backgroundColor: mode === 'light'
                                ? grey[100]
                                : grey[900],
                        ...(!matchesSM && {
                            // paddingTop: theme.spacing(3),
                            // paddingBottom: theme.spacing(3),
                            transition: transitions.create('margin', {
                                easing: transitions.easing.sharp,
                                duration: transitions.duration.leavingScreen,
                            }),
                            // marginLeft: `-${drawerWidth}px`,
                            ...(open && {
                                transition: transitions.create('margin', {
                                easing: transitions.easing.easeOut,
                                duration: transitions.duration.enteringScreen,
                            }),
                        })
                    })}}
                >
                    {matchesSM ? <Toolbar /> : <NarrowDrawerHeader />}
                    <Container 
                        maxWidth={false}
                        sx={{
                            p:'0 !important',
                        }}
                    >
                        {children}
                    </Container>
                </Box>
                <FileTransferListDrawer />
            </Box>
            <Backdrop 
                open={loading}
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <CircularProgress />
            </Backdrop>
            <WebsocketOfflineTooLongDialog />
            </>
        )
    }),
    DrawerContent = memo(({userRight}:{userRight:number})=>(
        <Grid
            container
            direction='column'
            sx={{
                justifyContent:'space-between',
                height:'100%',
                overflowX:'hidden'
            }}
        >
            <TopSideBarButtons {...{userRight}} />
            <BottomSidebarButtons />
        </Grid>
    ))
Layout.displayName = 'Layout'
LayoutWrapper.displayName = 'LayoutWrapper'
LayoutContent.displayName = 'LayoutContent'
DrawerContent.displayName = 'DrawerContent'
export default Layout;