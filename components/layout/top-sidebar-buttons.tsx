import React, { memo } from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/router';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { openSidebar } from '@reducers/misc';
import List from '@mui/material/List';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useStore } from 'react-redux';
import constants from '@components/constants';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const 
    TopSideBarButtons = memo((
        {
            userRight,
        }:{
            userRight:number;
        }
    ) => {
        const
            store = useStore(),
            router = useRouter(),
            visitor = useAppSelector(state => state.misc.visitor),
            taskOnClick = ()=> {
                const 
                    state = store.getState() as ReduxState,
                    uid = state.misc.uid,
                    view = localStorage.getItem(`${uid}${constants.taskViewLocalStorageKey}`)

                if (!!view && constants.tasksViews.includes(view)) router.push(`/?page=tasks&view=${view}`,`/tasks/v/${view}`,{shallow:true})
                else router.push(`/?page=tasks&view=${constants.tasksViews[0]}`,`/tasks/v/${constants.tasksViews[0]}`,{shallow:true})
            }

        return (
            <List>
                <ListItemWrapper {...{href:'/?page=dashboard',as:'/',title:'Dashboard'}}>
                    <DashboardIcon fontSize='large' />
                </ListItemWrapper>
                <ListItemWrapper {...{href:'/?page=tasks',as:'/tasks',title:'Tasks',onClick:taskOnClick}}>
                    <AssignmentTurnedInRoundedIcon fontSize='large' />
                </ListItemWrapper>
                <ListItemWrapper {...{href:'/?page=chat',as:'/chat',title:'Chat'}}>
                    <ForumRoundedIcon fontSize='large' />
                </ListItemWrapper>
                {(!visitor && !!(userRight & 1)) && <ListItemWrapper {...{href:'/?page=hrm',as:'/hrm',title:'Staff Management'}}>
                    <PersonIcon fontSize='large' />
                </ListItemWrapper>}
                {visitor && <ListItemWrapper {...{href:'/?page=about',as:'/about',title:'About'}}>
                    <InfoOutlinedIcon fontSize='large' />
                </ListItemWrapper>}
            </List>
        )
    }),
    ListItemWrapper = (
        {
            href,
            as,
            title,
            children,
            onClick,
            nested,
        }:{
            href:string;
            as:string;
            title:string;
            children:JSX.Element;
            onClick?:()=>void;
            nested?:number;
        }
    ) => {
        const 
            theme = useTheme(),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            router = useRouter(),
            dispatch = useAppDispatch(),
            linkOnClick = (e:any) => {
                e.preventDefault()
                if (!matchesSM) dispatch(openSidebar(false))
                if (!!onClick) onClick()
                else router.push(href,as,{shallow:true})
            }

        return (
            <Tooltip 
                title={title}
                disableFocusListener={sidebarOpen}
                disableHoverListener={sidebarOpen}
                disableInteractive={sidebarOpen}
                disableTouchListener={sidebarOpen}
            >
                <ListItemButton
                    component='a'
                    href={as}
                    onClick={linkOnClick}
                    sx={{
                        ...(!!nested && {pl:(nested + 1) * 2})
                    }}
                >
                    <ListItemIcon>
                        {children}
                    </ListItemIcon>
                    <ListItemText primary={title} />
                </ListItemButton>
            </Tooltip>
        )
    }

TopSideBarButtons.displayName = 'TopSideBarButtons'
export {TopSideBarButtons,ListItemWrapper};