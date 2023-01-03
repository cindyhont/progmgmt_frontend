import React, { memo, useCallback, useMemo, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { createSelector } from '@reduxjs/toolkit';
import { chatRoomFileInputSetAll, chatRoomSelector, chatUserFileInputSetAll, chatUserSelector } from '../../reducers/slice';
import { fileInputSelector } from '@components/functions';
import { useRouter } from 'next/router';
import { FileDraft } from '@components/interfaces';
import FileDialog from '@components/common-components/file-dialog';
import Badge from '@mui/material/Badge';

const FileButton = memo(() => {
    const
        dispatch = useAppDispatch(),
        router = useRouter(),
        roomID = router.query.roomid as string,
        userID = router.query.userid as string,
        fileBtnOnClick = () => setFileDialogOpen(true),
        [fileDialogOpen,setFileDialogOpen] = useState(false),
        fileDialogOnClose = useCallback(()=>setFileDialogOpen(false),[]),
        filesSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>{
                if (!userID && !roomID) return []
                if (!!roomID) {
                    const r = chatRoomSelector.selectById(state,roomID)
                    return !!r ? fileInputSelector.selectAll(r.fileInputs) : []
                } else {
                    const u = chatUserSelector.selectById(state,userID)
                    return !!u ? fileInputSelector.selectAll(u.fileInputs) : []
                }
            }
        ),[roomID,userID]),
        files = useAppSelector(state => filesSelector(state)),
        updateFiles = useCallback((e:FileDraft[])=>{
            if (!!roomID) dispatch(chatRoomFileInputSetAll({files:e,roomID}))
            else if (!!userID) dispatch(chatUserFileInputSetAll({files:e,userID}))
        },[roomID,userID])

    return (
        <>
        <IconButton 
            size='small' 
            onClick={fileBtnOnClick}
            sx={{
                position:'absolute',
                bottom:'0px',
            }}
        >
            <Badge 
                badgeContent={files.length} 
                max={9} 
                color='primary'
                anchorOrigin={{horizontal:'left',vertical:'top'}}
            >
                <AttachFileIcon />
            </Badge>
        </IconButton>
        <FileDialog {...{
            open:fileDialogOpen,
            onClose:fileDialogOnClose,
            files,
            updateFiles
        }} />
        </>
    )
})
FileButton.displayName = 'FileButton'
export default FileButton