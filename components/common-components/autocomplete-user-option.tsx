import React, { HTMLAttributes } from "react"
import Avatar from "@mui/material/Avatar"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import { useAppSelector } from "@reducers"
import { userDetailsSelector } from "@reducers/user-details/slice"

const AutocompleteUserOption = (props:HTMLAttributes<HTMLLIElement> & {uid:string}) => {
    const 
        firstName = useAppSelector(state => userDetailsSelector.selectById(state,props.uid).firstName),
        lastName = useAppSelector(state => userDetailsSelector.selectById(state,props.uid).lastName),
        avatar = useAppSelector(state => userDetailsSelector.selectById(state,props.uid).avatar)

    return (
        <Grid 
            component='li'
            pl={2}
            container
            direction='row'
            {...props}
            wrap='nowrap'
        >
            <Avatar src={avatar} sx={{mr:2}} />
            <Typography sx={{textOverflow:'ellipsis',overflow: 'hidden', whiteSpace: 'nowrap'}}>{`${firstName} ${lastName}`.trim()}</Typography>
        </Grid>
    )
}

export default AutocompleteUserOption