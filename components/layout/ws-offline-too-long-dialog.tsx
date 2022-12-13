import { ReduxState, useAppSelector } from '@reducers'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { createSelector } from '@reduxjs/toolkit';
import { GoogleFile } from '@reducers/google-download-api/slice';
import { GoogleFilePrelim } from '@reducers/google-upload-api/slice';
import { selectFilesDownloading, selectFilesUploading, DrawerContent as FileList } from './file-transfer-list-drawer'
import Stack from '@mui/material/Stack';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button'
import { useRouter } from 'next/router';
import { pushToLogin } from '@components/functions';
import { useStore } from 'react-redux';

const WebsocketOfflineTooLongDialog = memo(()=>{
    const
        [open,setOpen] = useState(false),
        lastWebsocketOfflineTime = useAppSelector(state => state.misc.lastWebsocketOfflineTime),
        websocketWorking = useAppSelector(state => state.misc.websocketWorking),
        pageVisibility = useAppSelector(state => state.misc.pageVisibility),
        timeoutRef = useRef<NodeJS.Timeout>(),
        oneHour = useRef(1000 * 60 * 60).current,
        openDialog = () => setOpen(true),
        filesTransmittingSelector = useMemo(()=>createSelector(
            selectFilesDownloading,
            selectFilesUploading,
            (filesDownloading:GoogleFile[],filesUploading:GoogleFilePrelim[])=> filesDownloading.length + filesUploading.length !== 0
        ),[]),
        hasFilesTransmitting = useAppSelector(state => filesTransmittingSelector(state)),
        router = useRouter(),
        openNewTab = () => window.open(window.location.href,'_blank'),
        signInAgain = () => pushToLogin(router),
        store = useStore()

    useEffect(()=>{
        if (!websocketWorking && !!lastWebsocketOfflineTime && pageVisibility && !open) {
            const 
                state = store.getState() as ReduxState,
                lastWebsocketOfflineTime = state.misc.lastWebsocketOfflineTime,
                now = Date.now()

            if (lastWebsocketOfflineTime < now - oneHour) openDialog()
            else timeoutRef.current = setTimeout(openDialog,oneHour - (now - lastWebsocketOfflineTime))
        }
        return () => clearTimeout(timeoutRef.current)
    },[websocketWorking,lastWebsocketOfflineTime,pageVisibility])

    return (
        <Dialog open={open} keepMounted>
            <DialogTitle>This session has expired.</DialogTitle>
            {hasFilesTransmitting && <DialogContent>
                <Stack direction='column' spacing={2}>
                    <Typography>The following files are still being transmitted.</Typography>
                    <TableContainer sx={{overflowY:'scroll'}}>
                        <Table>
                            <TableBody>
                                <FileList />
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </DialogContent>}
            <DialogActions>
                {hasFilesTransmitting && <Button variant='contained' onClick={openNewTab}>Open New Tab</Button>}
                {!hasFilesTransmitting && <Button variant='contained' onClick={signInAgain}>Sign In Again</Button>}
            </DialogActions>
        </Dialog>
    )
})
WebsocketOfflineTooLongDialog.displayName = 'WebsocketOfflineTooLongDialog'
export default WebsocketOfflineTooLongDialog