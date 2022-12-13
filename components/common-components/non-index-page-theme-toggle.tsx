import { useAppDispatch, useAppSelector } from '@reducers'
import { updateUserMode } from '@reducers/misc'
import React, { memo, useRef } from 'react'
import IconButton from '@mui/material/IconButton';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import Tooltip from '@mui/material/Tooltip';
import { capitalizeSingleWord } from '@components/functions';

const NonIndexPageThemeToggle = memo(()=>{
    const 
        arr = useRef(['light','system','dark'] as ('light'|'system'|'dark')[]).current,
        dispatch = useAppDispatch(),
        userMode = useAppSelector(state => state.misc.userMode),
        onClick = () => {
            const 
                idx = arr.indexOf(userMode),
                mode = arr[(idx + 1) % 3]
            dispatch(updateUserMode(mode))
            sessionStorage.setItem('userMode',mode)
        }
        
    return (
        <Tooltip title={`Current mode: ${capitalizeSingleWord(userMode)}`}>
            <IconButton
                onClick={onClick}
                sx={{ ml: 1, position:'absolute',top:'24px',right:'24px' }} 
                size='large' 
                color="inherit"
            >
                {userMode==='light' && <LightModeRoundedIcon />}
                {userMode==='system' && <SettingsBrightnessRoundedIcon />}
                {userMode==='dark' && <DarkModeRoundedIcon />}
            </IconButton>
        </Tooltip>
    )
})
NonIndexPageThemeToggle.displayName = 'NonIndexPageThemeToggle'
export default NonIndexPageThemeToggle