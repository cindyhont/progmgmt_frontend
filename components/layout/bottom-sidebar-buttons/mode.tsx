import React, { memo, useRef } from 'react'
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import { useAppDispatch, useAppSelector } from '@reducers';
import { updateUserMode } from '@reducers/misc';
import { capitalizeSingleWord } from '@components/functions';

const 
    Mode = memo(()=>{
        const 
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            arr = useRef(['Light','System','Dark'] as ('Light'|'System'|'Dark')[]).current
        if (sidebarOpen) return (
            <li>
                <ButtonGroup sx={{mx:1,my:2}}>
                    {arr.map(value=>(
                        <ModeButton key={value} {...{value}} />
                    ))}
                </ButtonGroup>
            </li>
        )
        else return <ModeSidebarClosed />
    }),
    ModeButton = (
        {
            value,
        }:{
            value:'Dark'|'Light'|'System';
        }
    ) => {
        const 
            dispatch = useAppDispatch(),
            userMode = useAppSelector(state => state.misc.userMode),
            onClick = () => {
                const mode = value.toLowerCase() as 'dark'|'light'|'system'
                dispatch(updateUserMode(mode))
                sessionStorage.setItem('userMode',mode)

            }

        return (
            <Button 
                variant={userMode===value.toLowerCase() ? 'contained' : 'outlined'}
                sx={{fontSize:'0.8rem'}}
                onClick={onClick}
            >{value}</Button>
        )
    },
    ModeSidebarClosed = () => {
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
                <ListItemButton onClick={onClick}>
                    <ListItemIcon>
                        {userMode==='light' && <LightModeRoundedIcon fontSize='large' />}
                        {userMode==='system' && <SettingsBrightnessRoundedIcon fontSize='large' />}
                        {userMode==='dark' && <DarkModeRoundedIcon fontSize='large' />}
                    </ListItemIcon>
                    <ListItemText primary='' />
                </ListItemButton>
            </Tooltip>
        )
    }

Mode.displayName = 'Mode'
export default Mode