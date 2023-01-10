import React, { memo, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import { ReduxState, useAppSelector } from '@reducers';
import { createSelector } from '@reduxjs/toolkit';
import { chatRoomSelector, chatUserSelector } from '../../reducers/slice';
import { fileInputSelector } from '@components/functions';
import { useRouter } from 'next/router';

const SubmitBtn = memo(({noInputString}:{noInputString:boolean;}) => {
    const 
        router = useRouter(),
        roomID = router.query.roomid as string,
        userID = router.query.userid as string,
        noFileInputSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>{
                if (!roomID && !userID) return true
                const fileInput = !!roomID
                    ? chatRoomSelector.selectById(state,roomID).fileInputs
                    : chatUserSelector.selectById(state,userID).fileInputs;
                return fileInputSelector.selectTotal(fileInput)===0
            }
        ),[roomID,userID]),
        noFileInput = useAppSelector(state => noFileInputSelector(state))

    return (
        <IconButton 
            size='small' 
            id='chat-submit-btn'
            sx={{
                transform:'translateY(-2px) rotate(-30deg)',
                position:'absolute',
                bottom:'0px',
            }}
            color='primary'
            disabled={noInputString && noFileInput}
        >
            <SendIcon />
        </IconButton>
    )
})
SubmitBtn.displayName = 'SubmitBtn'
export default SubmitBtn