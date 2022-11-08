import React, { memo } from 'react'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import Tooltip from '@mui/material/Tooltip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useAppSelector } from '@reducers';
import { useTheme } from '@mui/material';

const Logout = memo(()=>{
    const 
        {palette:{error}} = useTheme(),
        sidebarOpen = useAppSelector(state => state.misc.sidebarOpen)
    
    return (
        <Tooltip 
            title='Sign Out'
            disableFocusListener={sidebarOpen}
            disableHoverListener={sidebarOpen}
            disableInteractive={sidebarOpen}
            disableTouchListener={sidebarOpen}
        >
            <ListItemButton
                component='a'
                href='/logout'
                sx={{
                    '&:hover':{
                        backgroundColor:error.main,
                        '.MuiSvgIcon-root':{
                            fill:'#fff',
                        },
                        '.MuiListItemText-root':{
                            color:'#fff',
                        }
                    }
                }}
            >
                <ListItemIcon>
                    <LogoutRoundedIcon 
                        fontSize='large' 
                        sx={{
                            fill:error.main,
                        }} 
                    />
                </ListItemIcon>
                <ListItemText 
                    primary='Sign Out' 
                    sx={{
                        color:error.main,
                    }} 
                />
            </ListItemButton>
        </Tooltip>
    )
})
Logout.displayName = 'Logout'
export default Logout