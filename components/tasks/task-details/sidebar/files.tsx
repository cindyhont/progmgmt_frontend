import { ReduxState, useAppSelector } from "@reducers";
import React, { memo, useMemo, useRef, ChangeEvent, useEffect } from "react";
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import { ConfirmBeforeRemoveFile, FileDivertComponent } from "@components/common-components";
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { GoogleFile, googleFileSelector } from "@reducers/google-download-api/slice";
import { useStore } from "react-redux";
import { v4 as uuidv4 } from 'uuid'
import { taskSelector } from "@components/tasks/reducers/slice";
import { Task } from "@components/tasks/interfaces";
import { useTaskAddFilesMutation, useTaskUpdateOneFieldMutation } from "@components/tasks/reducers/api";
import { useRouter } from "next/router";
import { GoogleFilePrelim, googleFilePrelimSelector } from "@reducers/google-upload-api/slice";
import useWindowEventListeners from "@hooks/event-listeners/window";

const 
    Files = memo(()=>{
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            fileIDs = useAppSelector(state => taskSelector.selectById(state,taskID).fileIDs),
            theme = useTheme(),
            editRightSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID),
                (state:ReduxState)=>state.misc.uid,
                (t:Task,uid:EntityId)=>[...t.supervisors,t.owner].includes(uid)
            ),[taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state))

        if (!fileIDs.length) return <></>
        return (
            <Stack 
                direction='column' 
                spacing={1} 
                sx={{
                    mb:'16px !important',
                    px:1,
                    ...(theme.palette.mode==='light' && {
                        '.MuiTable-root':{
                            backgroundColor:theme.palette.grey[200]
                        }
                    })
                }}
            >
                {fileIDs.map(id=>(<File key={id} {...{fileID:id,hasEditRight}} />))}
                {hasEditRight && <Uploader />}
            </Stack>
        )
    }),
    Uploader = memo(()=>{
        const
            theme = useTheme(),
            router = useRouter(),
            taskID = router.query.taskid as string,
            dragHasFiles = useRef(false),
            fileInputRef = useRef<HTMLInputElement>(),
            selectFileOnClick = () => fileInputRef.current.click(),
            [taskAddFiles] = useTaskAddFilesMutation(),
            ref = useRef<HTMLDivElement>(),
            addFiles = (filesToAdd:File[]) => taskAddFiles({
                taskID,
                files:filesToAdd.map(f=>({
                    id:uuidv4(),
                    name:f.name,
                    size:f.size,
                    url:URL.createObjectURL(f),
                    folder:'private' as 'private',
                    mimeType:!!f.type ? f.type : '*/*',
                    parentID:'files'
                }))
            }),
            handleDragEnter = () => {
                if (dragHasFiles.current) ref.current.style.border = `3px dashed ${theme.palette.mode==='light' ? theme.palette.grey[600] : 'rgba(255,255,255,0.5)'}`
            },
            handleDragLeave = () => {
                ref.current.style.border = `3px dashed ${theme.palette.mode==='light' ? theme.palette.grey[400] : 'rgba(255,255,255,0.3)'}`
            },
            handleDrop = (e:React.DragEvent<HTMLDivElement>) => {
                e.preventDefault()
                e.stopPropagation()
                handleDragLeave()
                if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
                addFiles(Array.from(e.dataTransfer.files))
            },
            handleDrag = (e:React.DragEvent<HTMLDivElement>) => {
                e.preventDefault()
                e.stopPropagation()
                handleDragEnter()
            },
            fileInputOnChange = (e:ChangeEvent<HTMLInputElement>) => {
                e.preventDefault()
                e.stopPropagation()
                if (!e.target.files || e.target.files.length===0) return
                addFiles(Array.from(e.target.files))
            },
            checkDragHasFiles = (e:DragEvent) => dragHasFiles.current = e.dataTransfer.types.includes('Files')

        useWindowEventListeners([
            {evt:'dragover',func:checkDragHasFiles},
        ])

        return (
            <Grid
                container
                ref={ref}
                sx={{
                    borderRadius:2,
                    border:`3px dashed ${theme.palette.mode==='light' ? theme.palette.grey[400] : 'rgba(255,255,255,0.3)'}`,
                    p:2
                }}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
            >
                <Typography 
                    align="center"
                    sx={{
                        width:'inherit',
                        fontSize:'0.8rem',
                    }}
                >Drop files here<br />OR</Typography>
                <Button 
                    fullWidth 
                    onClick={selectFileOnClick}
                    sx={{
                        textTransform:'none',
                        my:-1,
                        fontSize:'0.8rem',
                        '&:hover':{
                            backgroundColor:'transparent'
                        }
                    }}
                >Select files</Button>
                <input hidden type='file' multiple accept='*/*' ref={fileInputRef} onChange={fileInputOnChange} />
            </Grid>
        )
    }),
    File = memo((
        {
            fileID,
            hasEditRight,
        }:{
            fileID:EntityId;
            hasEditRight:boolean;
        }
    )=>{
        const
            {palette:{mode}} = useTheme(),
            router = useRouter(),
            taskID = router.query.taskid as string,
            fileNameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>googleFileSelector.selectById(state,fileID),
                (state:ReduxState)=>googleFilePrelimSelector.selectById(state,fileID),
                (downloadable:GoogleFile,uploading:GoogleFilePrelim)=>{
                    if (!!downloadable) return downloadable.name
                    else if (!!uploading) return uploading.fileName
                    else return ''
                }
            ),[fileID]),
            fileName = useAppSelector(state => fileNameSelector(state)),
            fileToBeDeletedSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID).filesToDelete.includes(fileID),
                (e:boolean)=>e
            ),[taskID,fileID]),
            fileToBeDeleted = useAppSelector(state => fileToBeDeletedSelector(state)),
            store = useStore(),
            [updateTaskField] = useTaskUpdateOneFieldMutation(),
            onCancel = () => {
                const state = store.getState() as ReduxState
                updateTaskField({
                    id:taskID,
                    field:'filesToDelete',
                    value:taskSelector.selectById(state,taskID).filesToDelete.filter(f=>f!==fileID)
                })
            },
            onDelete = () => {
                const state = store.getState() as ReduxState
                updateTaskField({
                    id:taskID,
                    field:'fileIDs',
                    value:taskSelector.selectById(state,taskID).fileIDs.filter(f=>f!==fileID)
                })
            }

        if (fileToBeDeleted && hasEditRight) return <ConfirmBeforeRemoveFile {...{
            fileName,
            onCancel,
            onDelete,
            backgroundColor:`rgba(255,255,255,${mode==='light' ? 1 : 0.2})`
        }} />

        return <FileDivertComponent 
            {...{
                id:fileID,
                inChat:false,
                ...(hasEditRight && {
                    dataset:{
                        'data-taskid':taskID.toString(),
                        'data-fileid':fileID.toString()
                    }
                })
            }} 
        />
    })
Files.displayName = 'Files'
Uploader.displayName = 'Uploader'
File.displayName = 'File'
export default Files