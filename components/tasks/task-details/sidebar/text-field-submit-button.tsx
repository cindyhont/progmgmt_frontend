import { useTheme } from '@mui/material'
import React from 'react'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import IconButton from '@mui/material/IconButton'

const TextFieldSubmitButton = ({onSubmit}:{onSubmit:()=>void}) => {
    const {palette:{primary,getContrastText}} = useTheme()
    return (
        <IconButton 
            sx={{
                backgroundColor:primary.main,
                borderRadius:1,
                ml:2,
                mr:1,
                '&:hover':{
                    backgroundColor:primary.dark,
                },
                '.MuiSvgIcon-root':{
                    fill:getContrastText(primary.main),
                    '&:hover':{
                        fill:getContrastText(primary.dark)
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