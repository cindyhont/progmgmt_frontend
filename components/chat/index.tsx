import React, { createContext, Dispatch, MouseEvent, useEffect, useReducer, useRef } from 'react'
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
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
import useNarrowBody from 'hooks/theme/narrow-body';
import useWindowHeight from '@hooks/theme/window-height';

const 
    ToggleMenuDialogContext = createContext<{toggleMenuDialogDispatch:Dispatch<Iactions>}>({toggleMenuDialogDispatch:()=>{}}),
    ChatPanel = () => {
        const 
            convoRef = useRef<HTMLDivElement>(),
            {palette:{grey,mode}} = useTheme(),
            dispatch = useAppDispatch(),
            [menuDialogState,toggleMenuDialogDispatch] = useReducer(reducer,initialState),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen,shallowEqual),
            narrowBody = useNarrowBody(),
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
            userID = query.userid as string,
            height = useWindowHeight()

        useEffect(()=>{
            if (narrowBody) convoRef.current.style.left = (!!roomID || !!userID) ? '0%' : '100%'
            else convoRef.current.style.left = null
        },[userID,roomID,narrowBody])
        
        return (
            <>
            <Grid
                container
                direction='row'
                mt={1}
                sx={{
                    height:`calc(${height} - 79px)`,
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
                        height:`calc(${height} - 79px)`,
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
                        height:`calc(${height} - 79px)`,
                        ...(narrowBody ? {
                            position:'absolute',
                            zIndex:2,
                            top:0,
                            left:'100%',
                            width:'100%',
                            backgroundColor:grey[mode==='light' ? 100 : 900],
                            transition:'left 0.3s'
                        } : {})
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