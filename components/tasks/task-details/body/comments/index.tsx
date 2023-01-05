import React, { createContext, memo, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import { useRouter } from 'next/router'
import { createSelector, EntityId } from '@reduxjs/toolkit'
import { ReduxState, useAppSelector } from '@reducers'
import { taskCommentSelector } from '@components/tasks/reducers/slice'
import Pagination from '@mui/material/Pagination'
import { TaskComment } from '@components/tasks/interfaces'
import CommentBox from './comment-box'
import Comment from './comment'
import { BlankMessage } from '@components/common-components'

const
    entriesPerPage = 10,
    PageNumberContext = createContext({page:1,toPage:(e:number)=>{}}),
    ReplyEditContext = createContext<{commentMode:'reply'|'edit';replyEditID:EntityId;}>({commentMode:null,replyEditID:null}),
    DispatchContext = createContext<{
        updateCommentMode:(e:'reply'|'edit')=>void;
        updateReplyEditID:(e:EntityId)=>void;
        updateValue:(e:string)=>void;
    }>({
        updateCommentMode:()=>{},
        updateReplyEditID:()=>{},
        updateValue:()=>{},
    }),
    Comments = memo(({display}:{display:boolean})=>{
        const
            router = useRouter(),
            taskID = router.query.taskid as string,
            hasCommentsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskCommentSelector.selectAll(state).filter(e=>e.taskID===taskID).length!==0,
                (e:boolean)=>e
            ),[taskID]),
            hasComments = useAppSelector(state => hasCommentsSelector(state)),
            [page,setPage] = useState(1),
            pageCountSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskCommentSelector.selectAll(state).filter(e=>e.taskID===taskID).length,
                (e:number)=>Math.ceil(e / entriesPerPage)
            ),[taskID]),
            pageCount = useAppSelector(state => pageCountSelector(state)),
            pageOnChange = (_:SyntheticEvent,e:number)=>setPage(e),
            toPage = useCallback((e:number)=>setPage(e),[]),
            [commentMode,setCommentMode] = useState<'reply'|'edit'>(null),
            [replyEditID,setReplyEditID] = useState<EntityId>(null),
            updateCommentMode = useCallback((e:'reply'|'edit')=>setCommentMode(e),[]),
            updateReplyEditID = useCallback((e:EntityId)=>setReplyEditID(e),[]),
            [value,setValue] = useState(''),
            updateValue = useCallback((e:string)=>setValue(e),[])

        useEffect(()=>{
            if (hasComments) setPage(pageCount)
        },[])

        return (
            <PageNumberContext.Provider value={{page,toPage}}>
                <ReplyEditContext.Provider value={{commentMode,replyEditID}}>
                    <DispatchContext.Provider value={{updateCommentMode,updateReplyEditID,updateValue}}>
                        <Stack direction='column' spacing={2} sx={{display:display ? 'block' : 'none',my:2}}>
                            <div id='comment-list-top' />
                            {hasComments ? <CommentList /> : <BlankMessage {...{text:'No one has written a comment.'}} />}
                            <div id='comment-list-bottom' />
                            <Stack direction='column' spacing={2} id='comment-section-bottom'>
                                {hasComments && <Grid container direction='row' sx={{justifyContent:'center'}}>
                                    <Pagination count={pageCount} page={page} onChange={pageOnChange} />
                                </Grid>}
                                <CommentBox {...{value}} />
                            </Stack>
                        </Stack>
                    </DispatchContext.Provider>
                </ReplyEditContext.Provider>
            </PageNumberContext.Provider>
        )
    }),
    CommentList = memo(() => {
        const
            {page} = useContext(PageNumberContext),
            router = useRouter(),
            taskID = router.query.taskid as string,
            idsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskCommentSelector.selectAll(state).filter(e=>e.taskID===taskID),
                (comments:TaskComment[])=>{
                    const count = comments.length
                    if (!count) return []
                    if (count===1) return [comments[0].id]
                    const start = (page - 1) * entriesPerPage
                    return Array.from(comments).sort((a,b)=>a.dt-b.dt).slice(start,Math.min(start + entriesPerPage,count)).map(({id})=>id)
                }
            ),[taskID,page]),
            ids = useAppSelector(state => idsSelector(state)),
            [narrowScreen,setNarrowScreen] = useState(false),
            updateScreen = () => setNarrowScreen(window.innerWidth < 300)

        useEffect(()=>{
            updateScreen()
            window.addEventListener('resize',updateScreen,{passive:true})
            return () => window.removeEventListener('resize',updateScreen)
        },[])

        return (
            <>
            {ids.map(id=>(<Comment key={id} {...{id,narrowScreen}} />))}
            </>
        )
    })

Comments.displayName = 'Comments'
CommentList.displayName = 'CommentList'
export default Comments;
export {
    entriesPerPage,
    PageNumberContext,
    ReplyEditContext,
    DispatchContext,
}