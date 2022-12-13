import { useTheme } from '@mui/material'
import React from 'react'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import IconButton from '@mui/material/IconButton'

const TextFieldSubmitButton = ({onSubmit}:{onSubmit:()=>void}) => {
    const theme = useTheme()
    return (
        <IconButton 
            sx={{
                backgroundColor:theme.palette.primary.main,
                borderRadius:1,
                ml:2,
                mr:1,
                '&:hover':{
                    backgroundColor:theme.palette.primary.dark,
                },
                '.MuiSvgIcon-root':{
                    fill:theme.palette.getContrastText(theme.palette.primary.main),
                    '&:hover':{
                        fill:theme.palette.getContrastText(theme.palette.primary.dark)
                    }
                }
            }}
            onClick={onSubmit}
        >
            <CheckRoundedIcon />
        </IconButton>
    )
}

export default TextFieldSubmitButton