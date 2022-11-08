import React, { createContext, Dispatch, MouseEvent, useEffect, useReducer, useRef } from 'react'
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppDispatch, useAppSelector } from '@reducers';
import { shallowEqual } from 'react-redux'
import SideBar from './sidebar';
import Conversation from './conversation';
import RoomContextMenu from './dialogs-menus/room-context-menu';
import {ConvoOthersContextMenu,ConvoSelfContextMenu} from './dialogs-menus/convo-context-menu';
import NewGroupDialog from './dialogs-menus/new-group-dialog';
import ForwardDialog from './dialogs-menus/forward-dialog';
import { Iactions, initialState, openContextMenuAction, reducer } from './reducers/toggle-context-menu-dialog';
import { updateContextMenuID } from './reducers/slice';
import { useRouter } from 'next/router';

const 
    ToggleMenuDialogContext = createContext<{toggleMenuDialogDispatch:Dispatch<Iactions>}>({toggleMenuDialogDispatch:()=>{}}),
    ChatPanel = () => {
        const 
            convoRef = useRef<HTMLDivElement>(),
            theme = useTheme(),
            {palette:{grey,mode}} = theme,
            dispatch = useAppDispatch(),
            [menuDialogState,toggleMenuDialogDispatch] = useReducer(reducer,initialState),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            matchesMD = useMediaQuery(theme.breakpoints.up('md')),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen,shallowEqual),
            onContextMenu = (e:MouseEvent<HTMLDivElement>) => {
                const 
                    paths = e.nativeEvent.composedPath() as HTMLElement[],
                    count = paths.length,
                    coord = {
                        left:e.clientX,
                        top:e.clientY
                    }
                    
                for (let i=0; i<count; i++){
                    const {dataset} = paths[i]
                    if (!dataset || Object.keys(dataset).length===0) continue

                    if (!!dataset.roomid){
                        e.preventDefault()
                        dispatch(updateContextMenuID(dataset.roomid))
                        toggleMenuDialogDispatch(openContextMenuAction({...coord,key:'openRoomContextMenu'}))
                        break
                    }

                    if (!!dataset.convootherid){
                        e.preventDefault()
                        dispatch(updateContextMenuID(dataset.convootherid))
                        toggleMenuDialogDispatch(openContextMenuAction({...coord,key:'openConvoOthersContextMenu'}))
                        break
                    }

                    if (!!dataset.convoselfid){
                        e.preventDefault()
                        dispatch(updateContextMenuID(dataset.convoselfid))
                        toggleMenuDialogDispatch(openContextMenuAction({...coord,key:'openConvoSelfContextMenu'}))
                        break
                    }
                }
            },
            {query} = useRouter(),
            roomID = query.roomid as string,
            userID = query.userid as string

        useEffect(()=>{
            if (matchesMD || matchesSM && !sidebarOpen) convoRef.current.style.left = null
            else convoRef.current.style.left = (!!roomID || !!userID) ? '0%' : '100%'
        },[userID,roomID,(matchesMD || matchesSM && !sidebarOpen)])
        
        return (
            <>
            <Grid
                container
                direction='row'
                mt={1}
                sx={{
                    height:'calc(100vh - 79px)',
                    position:'relative',
                    overflowX:'hidden'
                }}
                onContextMenu={onContextMenu}
            >
                <Grid 
                    item 
                    md={sidebarOpen ? 5 : 4} 
                    sm={sidebarOpen ? 12 : 5} 
                    xs={12} 
                    sx={{
                        height:'calc(100vh - 79px)',
                        position:'relative',
                        overflow:'hidden',
                        '&:hover .MuiButtonBase-root':{
                            transform:'none'
                        }
                    }}
                >
                    <ToggleMenuDialogContext.Provider value={{toggleMenuDialogDispatch}}>
                        <SideBar />
                    </ToggleMenuDialogContext.Provider>
                </Grid>
                <Grid 
                    ref={convoRef}
                    item 
                    md={sidebarOpen ? 7 : 8} 
                    sm={sidebarOpen ? 12 : 7} 
                    xs={12} 
                    sx={{
                        height:'calc(100vh - 79px)',
                        // transform:matchesMD ? 'none' : matchesSM ? sidebarOpen ? 'translate(110%,-100%)' : 'none' : 'translate(110%,-100%)'
                        ...((!matchesSM || !matchesMD && sidebarOpen) && {
                            position:'absolute',
                            zIndex:2,
                            top:0,
                            left:'100%',
                            width:'100%',
                            backgroundColor:grey[mode==='light' ? 100 : 900],
                            transition:'left 0.3s'
                        })
                    }}
                ><Conversation /></Grid>
            </Grid>
            <ToggleMenuDialogContext.Provider value={{toggleMenuDialogDispatch}}>
                <RoomContextMenu {...{open:menuDialogState.openRoomContextMenu,anchorPosition:menuDialogState.contextMenuPosition}} />
                <ConvoOthersContextMenu {...{open:menuDialogState.openConvoOthersContextMenu,anchorPosition:menuDialogState.contextMenuPosition}} />
                <ConvoSelfContextMenu {...{open:menuDialogState.openConvoSelfContextMenu,anchorPosition:menuDialogState.contextMenuPosition}} />
                <NewGroupDialog open={menuDialogState.openNewGroupDialog} />
                <ForwardDialog open={menuDialogState.openForwardDialog} />
            </ToggleMenuDialogContext.Provider>
            </>
        )
    }

export default ChatPanel
export { ToggleMenuDialogContext }