import React, { useContext, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton'
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Popper from '@mui/material/Popper';
import MenuList from '@mui/material/MenuList';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import MenuItem from '@mui/material/MenuItem';
import { ToggleMenuDialogContext } from '..';
import { toggleDialogAction } from '../reducers/toggle-context-menu-dialog';
import Fade from '@mui/material/Fade';

const 
    SpeedDial = () => {
        const 
            theme = useTheme(),
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            [menuOpen,setMenuOpen] = useState(false),
            toggleMenu = () => setMenuOpen(prev => !prev),
            buttonRef = useRef<HTMLButtonElement>(),
            openNewGroupDialog = () => {
                toggleMenuDialogDispatch(toggleDialogAction({key:'openNewGroupDialog',open:true}))
                setMenuOpen(false)
            }

        return (
            <>
                <Popper
                    open={menuOpen}
                    anchorEl={buttonRef.current}
                    disablePortal
                    sx={{
                        zIndex:2,
                        backgroundColor:theme.palette.background.paper,
                        borderRadius:'10px',
                        boxShadow: Array(2)
                            .fill(theme.palette.mode==='light' ? '0' : '255')
                            .map((c,i)=>`0 0 ${(i+1) * 10}px rgba(${Array(3).fill(c).join(',')},0.1 )`)
                            .join(','),
                        inset:'auto auto 10px -25px !important',
                        minWidth:'200px',
                        '.MuiMenuItem-root':{
                            pl:2.5
                        }
                    }}
                    id='123'
                    transition
                >{({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={menuOpen ? 100 : 0}>
                        <MenuList>
                            <MenuItem onClick={openNewGroupDialog}>
                                <ListItemIcon>
                                    <GroupAddRoundedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>New Group</ListItemText>
                            </MenuItem>
                        </MenuList>
                    </Fade>
                )}</Popper>
                <IconButton
                    onClick={toggleMenu}
                    ref={buttonRef}
                    tabIndex={-1}
                    aria-describedby='123'
                    sx={{
                        backgroundColor:theme.palette.primary[theme.palette.mode],
                        p:1.5,
                        position:'absolute',
                        bottom:'5vh',
                        right:'30px',
                        transition:'all 0.3s ease',
                        zIndex:1,
                        '.MuiSvgIcon-root':{
                            fill:'#fff',
                            width:'2rem',
                            height:'2rem',
                            transition:'all 0.3s',
                            transform:menuOpen ? 'rotate(45deg)' : 'none'
                        },
                        '&:hover':{
                            backgroundColor:theme.palette.primary[theme.palette.mode],
                        },
                        '@media (pointer:fine)':{
                            transform:'translateY(30vh)'
                        }
                    }}
                >
                    <AddRoundedIcon />
                </IconButton>
            </>
        )
    }


export default SpeedDial;