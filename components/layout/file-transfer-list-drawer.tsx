import React, { memo, useCallback, useEffect, useMemo } from "react";
import { useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import { createSelector } from "@reduxjs/toolkit";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { GoogleFile, googleFileSelector } from "@reducers/google-download-api/slice";
import { GoogleFilePrelim, googleFilePrelimSelector } from "@reducers/google-upload-api/slice";
import Typography from "@mui/material/Typography";
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { FileDownload, FileUpload } from "@components/common-components";
import { updateFileTransferListOpenStatus } from "@reducers/misc";
import DrawerCommon from "./drawer-common";

const 
    selectFilesDownloading = (state:ReduxState)=>googleFileSelector.selectAll(state).filter(f=>f.url==='' && f.downloading),
    selectFilesUploading = (state:ReduxState)=>googleFilePrelimSelector.selectAll(state).filter(f=>f.googleFileID===''),
    FileTransferListDrawer = () => {
        const
            {zIndex:{drawer}} = useTheme(),
            open = useAppSelector(state => state.misc.fileTransferListOpen),
            dispatch = useAppDispatch(),
            updateDrawerStatus = useCallback((e:boolean) => dispatch(updateFileTransferListOpenStatus(e)),[])

        return (
            <DrawerCommon {...{
                open,
                onClose:()=>updateDrawerStatus(false),
                onOpen:()=>updateDrawerStatus(true),
                anchor:'right',
                sx:{
                    zIndex:drawer+2,
                }
            }} >
                <FileListLayout {...{onClose:()=>updateDrawerStatus(false)}} />
            </DrawerCommon>
        )
    },
    FileListLayout = ({onClose}:{onClose:()=>void}) => (
        <Table stickyHeader>
            <TableHead>
                <TableRow>
                    <TableCell 
                        sx={{
                            backgroundColor:'transparent',
                            display:'flex',
                            p:0.5
                        }}
                    >
                        <Grid container direction='column' sx={{justifyContent:'center',ml:1.5}}>
                            <Typography>File Transfer</Typography>
                        </Grid>
                        <IconButton onClick={onClose}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <DrawerContent />
            </TableBody>
        </Table>
    ),
    DrawerContent = memo(()=>{
        const 
            filesUploadIdSelector = useMemo(()=>createSelector(
                selectFilesUploading,
                (files:GoogleFilePrelim[])=>files.map(({id})=>id)
            ),[]),
            filesDownloadloadIdSelector = useMemo(()=>createSelector(
                selectFilesDownloading,
                (files:GoogleFile[])=>files.map(({id})=>id)
            ),[]),
            uploadIDs = useAppSelector(state=>filesUploadIdSelector(state)),
            downloadIDs = useAppSelector(state=>filesDownloadloadIdSelector(state))

        if (uploadIDs.length + downloadIDs.length === 0) return (
            <TableRow>
                <TableCell sx={{border:'none',p:0}}>
                    <Grid
                        container
                        direction='column'
                        sx={{
                            justifyContent:'center',
                            height:'calc(var(--viewport-height) - 114px)',
                            width:300,
                            maxWidth:'80vw'
                        }}
                    >
                        <Typography sx={{m:2}} textAlign='center'>No task for now.</Typography>
                    </Grid>
                </TableCell>
            </TableRow>
        )
        else return (
            <>
            {uploadIDs.map(id=>(<TableRow key={id}>
                <TableCell
                    sx={{
                        'p:first-of-type':{
                            fontWeight:'normal'
                        },
                        p:1,
                        pl:0
                    }}
                >
                    <FileUpload {...{id,inChat:false}} />
                </TableCell>
            </TableRow>))}
            {downloadIDs.map(id=>(<TableRow key={id}>
                <TableCell
                    sx={{
                        'p:first-of-type':{
                            fontWeight:'normal'
                        },
                        p:1,
                        pl:0
                    }}
                >
                    <FileDownload {...{id,inChat:false}} />
                </TableCell>
            </TableRow>))}
            </>
        )
    })
DrawerContent.displayName = 'DrawerContent'
export { FileTransferListDrawer, DrawerContent, selectFilesDownloading, selectFilesUploading }