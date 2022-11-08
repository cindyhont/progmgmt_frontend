import React, { memo, useMemo } from "react";
import { useTheme } from '@mui/material/styles';
import Fab from '@mui/material/Fab';
import CircularProgress from '@mui/material/CircularProgress';
import ImportExportRoundedIcon from '@mui/icons-material/ImportExportRounded';
import { createSelector } from "@reduxjs/toolkit";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { GoogleFile, googleFileSelector } from "@reducers/google-download-api/slice";
import { GoogleFilePrelim, googleFilePrelimSelector } from "@reducers/google-upload-api/slice";
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { updateFileTransferListOpenStatus } from "@reducers/misc";

const 
    selectFilesDownloading = (state:ReduxState)=>googleFileSelector.selectAll(state).filter(f=>f.url==='' && f.downloading),
    selectFilesUploading = (state:ReduxState)=>googleFilePrelimSelector.selectAll(state).filter(f=>f.googleFileID===''),
    FileTransferProgress = () => {
        const 
            showProgressSelector = useMemo(()=>createSelector(
                selectFilesDownloading,
                selectFilesUploading,
                (filesDownloading:GoogleFile[],filesUploading:GoogleFilePrelim[])=> filesDownloading.length + filesUploading.length !== 0
            ),[]),
            showProgress = useAppSelector(state=>showProgressSelector(state)),
            dispatch = useAppDispatch(),
            btnOnClick = () => dispatch(updateFileTransferListOpenStatus(true))

        if (showProgress) return (
            <ListItemButton onClick={btnOnClick} component='li'>
                <ListItemIcon>
                    <Icon />
                    <Progress />
                </ListItemIcon>
                <ListItemText primary='File Transfer Status' />
            </ListItemButton>
        )
        else return <></>
    },
    Icon = memo(()=>{
        const theme = useTheme()
        return (
            <Fab 
                size='small'
                sx={{
                    backgroundColor:"transparent",
                    boxShadow:'none',
                    '&:hover':{
                        backgroundColor:"transparent",
                    },
                    '.MuiSvgIcon-root':{
                        fill:theme.palette.text.primary
                    }
                }}
            ><ImportExportRoundedIcon /></Fab>
        )
    }),
    Progress = memo(() => {
        const
            theme = useTheme(),
            progressSelector = useMemo(()=>createSelector(
                selectFilesDownloading,
                selectFilesUploading,
                (filesDownloading:GoogleFile[],filesUploading:GoogleFilePrelim[])=> {
                    let bitsLoaded = 0, bitsTotal = 0
                    if (filesDownloading.length){
                        bitsLoaded += filesDownloading.map(f=>f.progress).reduce((a,b)=>a + b)
                        bitsTotal += filesDownloading.map(f=>f.size).reduce((a,b)=>a+b)
                    }
                    if (filesUploading.length){
                        bitsLoaded += filesUploading.map(f=>f.uploaded).reduce((a,b)=>a+b)
                        bitsTotal += filesUploading.map(f=>f.fileSize).reduce((a,b)=>a+b)
                    }
                    return bitsTotal === 0 ? 100 : Math.min(bitsLoaded * 100 / bitsTotal,99)
                }
            ),[]),
            progress = useAppSelector(state=>progressSelector(state))

        return (
            <CircularProgress 
                value={progress}
                variant='determinate'
                color={theme.palette.mode==='light' ? 'inherit' : 'primary'}
                sx={{
                    zIndex:1,
                    position:'absolute',
                }}
            />
        )
    })
Icon.displayName = 'Icon'
Progress.displayName = 'Progress'
export default FileTransferProgress