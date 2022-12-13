import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import { BlankMessage, WYSIWYGcommon } from '@components/common-components';
import { useTaskAddCommentMutation, useTaskEditCommentMutation } from '@components/tasks/reducers/api'
import { useRouter } from 'next/router'
import { ReduxState, useAppSelector } from '@reducers'
import { taskCommentSelector, taskSelector } from '@components/tasks/reducers/slice'
import { useTheme } from '@mui/material'
import { useStore } from 'react-redux'
import { DispatchContext, entriesPerPage, PageNumberContext, ReplyEditContext } from '.'
import { FileDraft } from '@components/interfaces'
import { createSelector, EntityId } from '@reduxjs/toolkit'
import { Task } from '@components/tasks/interfaces'
import ReplyOrEditBar from './reply-edit-bar'
import { googleFileSelector } from '@reducers/google-download-api/slice'
import { googleFilePrelimSelector } from '@reducers/google-upload-api/slice'
import FileDialog from '@components/common-components/file-dialog'

const CommentBox = memo(({value}:{value:string;}) => {
    const 
        router = useRouter(),
        taskID = router.query.taskid as string,
        commentRightsSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskSelector.selectById(state,taskID),
            (state:ReduxState)=>state.misc.uid,
            (t:Task,uid:EntityId)=>[...t.supervisors,...t.participants,t.owner,t.assignee].includes(uid)
        ),[taskID]),
        canComment = useAppSelector(state => commentRightsSelector(state)),
        {page,toPage} = useContext(PageNumberContext),
        {updateValue,updateCommentMode} = useContext(DispatchContext),
        buttonRef = useRef<HTMLButtonElement>(),
        handleUpdate = (e:string) => updateValue(e),
        [addComment] = useTaskAddCommentMutation(),
        store = useStore(),
        {commentMode,replyEditID} = useContext(ReplyEditContext),
        [editComment] = useTaskEditCommentMutation(),
        submitCommentEdit = () => {
            editComment({id:replyEditID,content:value,privateFiles:files})
            updateCommentMode(null)
            updateValue('')
            setFiles([])
        },
        theme = useTheme(),
        [files,setFiles] = useState<FileDraft[]>([]),
        updateFiles = useCallback((e:FileDraft[])=>setFiles([...e]),[]),
        [fileDialogOpen,setFileDialogOpen] = useState(false),
        updateDialogStatus = useCallback((e:boolean)=>setFileDialogOpen(e),[]),
        updateFilesForEditMode = () => {
            const 
                state = store.getState() as ReduxState,
                editComment = taskCommentSelector.selectById(state,replyEditID)
            if (!editComment) return

            const {fileIDs} = editComment
            if (fileIDs.length===0) {
                setFiles([])
                return
            }
            const
                fileDraftsUploading:FileDraft[] = googleFilePrelimSelector.selectAll(state)
                    .filter(e=>fileIDs.includes(e.id) && e.folder==='private')
                    .map(e=>({
                        id:e.id,
                        name:e.fileName,
                        size:e.fileSize,
                        url:'',
                        folder:'private',
                        mimeType:'',
                    })),
                fileDraftsDownloadable:FileDraft[] = googleFileSelector.selectAll(state)
                    .filter(e=>fileIDs.includes(e.id))
                    .map(e=>({
                        id:e.id,
                        name:e.name,
                        size:e.size,
                        url:'',
                        folder:'private',
                        mimeType:'',
                    }))
                setFiles([...fileDraftsUploading,...fileDraftsDownloadable])
        },
        submitOnClick = () => {
            buttonRef.current.blur()
            if (commentMode==='edit' && !!replyEditID) {
                submitCommentEdit()
                return
            }
            const 
                bottomSection = document.getElementById('comment-section-bottom'),
                state = store.getState() as ReduxState,
                newPageCount = Math.ceil((taskCommentSelector.selectAll(state).filter(e=>e.taskID===taskID).length + 1) / entriesPerPage)

            if (page===newPageCount) {
                bottomSection.style.position = 'sticky'
                bottomSection.style.bottom = '16px'
            }
            addComment({
                taskID,
                comment:value,
                privateFiles:files,
                ...(!!replyEditID && commentMode==='reply' && {replyCommentID:replyEditID})
            })
            updateValue('')
            setFiles([])
            if (page===newPageCount) setTimeout(()=>{
                document.getElementById('comment-list-bottom').scrollIntoView()
                bottomSection.style.position = null
                bottomSection.style.bottom = null
            },10)
            else {
                toPage(newPageCount)
                setTimeout(()=>{
                    document.getElementById('comment-list-top').scrollIntoView()
                },10)
            }
        }

    useEffect(()=>{
        if (commentMode==='edit' && !!replyEditID) updateFilesForEditMode()
    },[commentMode,replyEditID])
        
    return (
        <>
        {canComment && <>
        <Stack direction='column' spacing={2}>
            <Stack direction='column'>
                <ReplyOrEditBar />
                <Box sx={{backgroundColor:theme.palette.background.paper}}>
                    <WYSIWYGcommon {...{
                        value,
                        handleUpdate,
                        height:'min(50vh,200px)',
                        showFileIconMark:files.length !== 0,
                        fileBtnOnClick:()=>updateDialogStatus(true)
                    }} />
                </Box>
            </Stack>
            <Grid container direction='row' sx={{justifyContent:'flex-start','.MuiButtonBase-root':{fontSize:'0.8rem'}}}>
                <Button ref={buttonRef} id='submit-commit-btn' variant='contained' onClick={submitOnClick}>Submit</Button>
            </Grid>
        </Stack>
        <FileDialog {...{
            open:fileDialogOpen,
            onClose:()=>updateDialogStatus(false),
            files,
            updateFiles,
        }} />
        </>}
        {!canComment && <BlankMessage {...{text:"You cannot comment now."}} />}
        </>
    )
})
CommentBox.displayName = 'CommentBox'
export default CommentBox