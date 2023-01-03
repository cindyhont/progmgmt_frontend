import React, { memo, useContext, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { useTaskDeleteCommentMutation } from '@components/tasks/reducers/api'
import { useRouter } from 'next/router'
import { EntityId } from '@reduxjs/toolkit'
import { ReduxState, useAppSelector } from '@reducers'
import { taskCommentSelector } from '@components/tasks/reducers/slice'
import { TaskComment } from '@components/tasks/interfaces'
import { shallowEqual } from 'react-redux'
import { userDetailsSelector } from '@reducers/user-details/slice'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useTheme } from '@mui/material'
import { useStore } from 'react-redux'
import { DispatchContext, entriesPerPage, PageNumberContext } from '.'
import { UserDetails } from '@reducers/user-details/interfaces'
import { FileDivertComponent } from '@components/common-components/file-button'

const
    Comment = memo(({id,narrowScreen}:{id:EntityId;narrowScreen:boolean;})=>{
        const
            {dt,sender,content,editDt,replyMsgID,deleted,deleteDT,fileIDs} = useAppSelector(state => taskCommentSelector.selectById(state,id),shallowEqual) as TaskComment,
            {avatar,firstName,lastName} = useAppSelector(state => userDetailsSelector.selectById(state,sender),shallowEqual) as UserDetails,
            {palette:{grey}} = useTheme()

        if (deleted && !!deleteDT) return (
            <Paper id={id.toString()}>
                <Typography
                    sx={{
                        color:grey[500],
                        fontStyle:'italic',
                        fontSize:'0.8rem',
                        py:1,
                        px:2
                    }}
                >Comment deleted on {new Date(deleteDT).toLocaleString('en-UK',{timeStyle:'short',dateStyle:'medium'})}</Typography>
            </Paper>
        )

        return (
            <Paper id={id.toString()}>
                <Table sx={{'.MuiTableCell-root':{border:'none'}}}>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{verticalAlign:'top',px:2,pb:0,pt:1.5,width:0}}>
                                <Avatar src={avatar} />
                            </TableCell>
                            <TableCell sx={{pb:0,pt:1.5,pl:0}}>
                                <Stack direction='column'>
                                    <Box>
                                        <Typography sx={{fontWeight:'bold',fontSize:'0.85rem'}}>{firstName} {lastName}</Typography>
                                        <Typography sx={{fontSize:'0.7rem',textTransform:'uppercase'}}>
                                            {new Date(dt).toLocaleString('en-UK',{dateStyle:'medium',timeStyle:'short',hour12:true})}
                                            {!!editDt && <Typography
                                                sx={{
                                                    fontSize:'0.7rem',
                                                    fontStyle:'italic',
                                                    fontWeight:'300',
                                                    textTransform:'none',
                                                    ml:1.5
                                                }}
                                                component='span'
                                            >(Last Edited: {new Date(editDt).toLocaleString('en-UK',{dateStyle:'medium',timeStyle:'short',hour12:true})})</Typography>}
                                        </Typography>
                                    </Box>
                                    {!!replyMsgID && <Reply {...{id}} />}
                                    <Box dangerouslySetInnerHTML={{__html:content}} />
                                    {!narrowScreen && <>
                                        {fileIDs.length !== 0 && <FileList {...{commentID:id,narrowScreen}} />}
                                        <CommentButtons {...{id,narrowScreen}} />
                                    </>}
                                </Stack>
                            </TableCell>
                        </TableRow>
                        {narrowScreen && <>
                            {fileIDs.length !== 0 && <TableRow>
                                <TableCell colSpan={2} sx={{p:0,pl:2}}>
                                    <FileList {...{commentID:id,narrowScreen}} />
                                </TableCell>
                            </TableRow>}
                            <TableRow>
                                <TableCell colSpan={2} sx={{p:0,pl:2}}>
                                    <CommentButtons {...{id,narrowScreen}} />
                                </TableCell>
                            </TableRow>
                        </>}
                    </TableBody>
                </Table>
            </Paper>
        )
    }),
    FileList = memo(({commentID,narrowScreen}:{commentID:EntityId;narrowScreen:boolean;})=>{
        const 
            fileIDs = useAppSelector(state => taskCommentSelector.selectById(state,commentID).fileIDs),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            {palette:{mode,grey}} = useTheme()

        return (
            <Grid container direction='row' spacing={1} my={1}>
                {fileIDs.map(id=>(
                    <Grid 
                        item 
                        key={id}
                        xs={narrowScreen ? 12 : 6}
                        sm={6}
                        md={sidebarOpen ? 6 : 4}
                        lg={sidebarOpen ? 4 : 3}
                        xl={3}
                    ><FileDivertComponent {...{
                        id,
                        inChat:false,
                        ...(mode==='light' && {backgroundColor:grey[200]})
                    }} /></Grid>
                ))}
            </Grid>
        )
    }),
    Reply = memo((
        {
            id,
        }:{
            id:EntityId;
        }
    )=>{
        const 
            {palette:{mode,text}} = useTheme(),
            {replyMsg,replyMsgSender} = useAppSelector(state => taskCommentSelector.selectById(state,id)),
            {firstName,lastName} = useAppSelector(state => userDetailsSelector.selectById(state,replyMsgSender)),
            containerRef = useRef<HTMLDivElement>(),
            maxHeight = 120,
            [showCover,setShowCover] = useState(false)

        useEffect(()=>{
            if (containerRef.current.getBoundingClientRect().height > maxHeight) setShowCover(true)
        },[])

        return (
            <Box sx={{mt:2}}>
                <Grid
                    container
                    direction='column'
                    sx={{
                        backgroundColor:`rgba(${mode==='light' ? '255,255,255' : '0,0,0'},0.2)`,
                        borderRadius:2,
                        px:1.5,
                        pt:1,
                        display:!!replyMsgSender ? 'grid' : 'none',
                        maxHeight,
                        overflow:'hidden',
                        position:'relative'
                    }}
                >
                    <Box ref={containerRef}>
                        <Typography
                            sx={{
                                width:'fit-content',
                                fontSize:'0.8rem',
                            }}
                        >{firstName} {lastName}:</Typography>
                        <Box 
                            dangerouslySetInnerHTML={{__html:replyMsg}}
                            sx={{
                                fontSize:'0.8rem',
                                lineHeight:'0.8rem',
                                color:text.secondary,
                            }}
                        />
                    </Box>
                    {showCover && <Grid 
                        sx={{
                            width:'100%',
                            height:'100%',
                            position:'absolute',
                            top:'0px',
                            justifyContent:'flex-end',
                            backgroundImage:`linear-gradient(to bottom,transparent 50%,${mode==='light' ? 'white' : 'black'} 95%)`
                        }}
                        container
                        direction='column'
                    >
                        <Typography 
                            align='center' 
                            sx={{
                                mb:1,
                                fontSize:'0.8rem',
                                cursor:'pointer',
                                color:text.primary,
                                '&:hover':{
                                    color:text.secondary
                                }
                            }}
                        >GO TO COMMENT</Typography>
                    </Grid>}
                </Grid>
            </Box>
        )
    }),
    DeleteButton = memo(({id}:{id:EntityId})=>{
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            anchor = useRef<HTMLButtonElement>(),
            [open,setOpen] = useState(false),
            onClose = () => setOpen(false),
            buttonOnClick = () => setOpen(true),
            {palette:{error}} = useTheme(),
            store = useStore(),
            [deleteComment] = useTaskDeleteCommentMutation(),
            {page,toPage} = useContext(PageNumberContext),
            deleteOnClick = () => {
                onClose()
                const 
                    state = store.getState() as ReduxState,
                    newPageCount = Math.ceil((taskCommentSelector.selectAll(state).filter(e=>e.taskID===taskID).length - 1) / entriesPerPage)
                if (page > newPageCount && newPageCount !== 0) toPage(newPageCount)
                setTimeout(()=>deleteComment(id),10)
            }

        return (
            <>
            <Button ref={anchor} disableElevation disableRipple onClick={buttonOnClick}>Delete</Button>
            <Menu open={open} onClose={onClose} keepMounted anchorEl={anchor.current}>
                <MenuItem sx={{color:error.main}} onClick={deleteOnClick}>Confirm Delete</MenuItem>
                <MenuItem onClick={onClose}>Cancel</MenuItem>
            </Menu>
            </>
        )
    }),
    CommentButtons = ({id,narrowScreen}:{id:EntityId;narrowScreen:boolean;}) => {
        const
            {palette:{grey,mode}} = useTheme(),
            uid = useAppSelector(state => state.misc.uid),
            {sender} = useAppSelector(state => taskCommentSelector.selectById(state,id),shallowEqual) as TaskComment,
            {updateCommentMode,updateReplyEditID,updateValue} = useContext(DispatchContext),
            replyOnClick = () => {
                updateReplyEditID(id)
                updateCommentMode('reply')
                window.tinymce.activeEditor.focus()
                setTimeout(()=>document.getElementById('submit-commit-btn').scrollIntoView({behavior:'smooth'}),10)
            },
            store = useStore(),
            editOnClick = () => {
                const
                    state = store.getState() as ReduxState,
                    comment = taskCommentSelector.selectById(state,id)
                if (!comment) return
                updateValue(comment.content)
                updateReplyEditID(id)
                updateCommentMode('edit')
                
                setTimeout(()=>{
                    document.getElementById('submit-commit-btn').scrollIntoView({behavior:'smooth'})
                    window.tinymce.activeEditor.selection.select(window.tinymce.activeEditor.getBody(),true)
                    window.tinymce.activeEditor.selection.collapse(false)
                    window.tinymce.activeEditor.focus()
                },10)
            }

        return (
            <Stack 
                direction='row' 
                spacing={narrowScreen ? 2 : 4} 
                sx={{
                    '.MuiButtonBase-root':{
                        px:0,
                        py:1,
                        color:grey[500],
                        fontSize:'0.7rem',
                        minWidth:'unset',
                        fontWeight:'bold',
                        '&:hover':{
                            backgroundColor:'transparent',
                            color:grey[mode==='light' ? 900 : 50],
                        },
                        '&:focus':{
                            color:grey[500]
                        }
                    },
                }}
            >
                <Button disableElevation disableRipple onClick={replyOnClick}>Reply</Button>
                {sender === uid && <Button disableElevation disableRipple onClick={editOnClick}>Edit</Button>}
                {sender === uid && <DeleteButton {...{id}} />}
            </Stack>
        )
    }

Comment.displayName = 'Comment'
FileList.displayName = 'FileList'
DeleteButton.displayName = 'DeleteButton'
CommentButtons.displayName = 'CommentButtons'
Reply.displayName = 'Reply'
export default Comment