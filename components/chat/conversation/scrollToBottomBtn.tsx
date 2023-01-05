import React, { memo } from "react";
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import { useTheme } from '@mui/material/styles';
import scrollToBottom from "./functions/to-bottom";

const 
    ScrollToBottomBtn = memo(()=>{
        const {palette:{background,grey,mode,text}} = useTheme()
        return (
            <IconButton
                onClick={scrollToBottom}
                size='large'
                sx={{
                    backgroundColor:background.default,
                    pointerEvents:'initial',
                    opacity:'0.7',
                    border:`1px solid ${grey[mode==='light' ? 400 : 600]}`,
                    '&:hover':{
                        backgroundColor:background.default,
                        opacity:'1',
                        border:`1px solid ${text.primary}`,
                    }
                }}
            >
                <ArrowDownwardRoundedIcon />
            </IconButton>
        )
    }),
    ScrollToBottomBtnContainer = memo((
        {children}:{children:JSX.Element}
    )=>(
        <Grid 
            container 
            direction='row' 
            id='chat-to-bottom-btn'
            sx={{
                justifyContent:'center',
                position:'absolute',
                transition:'all 0.5s',
                opacity:'0',
                pointerEvents:'none'
            }}
        >{children}</Grid>
    ))

ScrollToBottomBtn.displayName = 'ScrollToBottomBtn'
ScrollToBottomBtnContainer.displayName = 'ScrollToBottomBtnContainer'
export {
    ScrollToBottomBtn,
    ScrollToBottomBtnContainer
}