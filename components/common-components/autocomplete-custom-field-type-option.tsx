import React, { HTMLAttributes } from "react"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import { useAppSelector } from "@reducers"
import { EntityId } from "@reduxjs/toolkit"
import { taskCustomFieldTypesSelector } from "@components/tasks/reducers/slice"

const AutocompleteCustomFieldTypeOption = (props:HTMLAttributes<HTMLLIElement> & {fieldtypeid:EntityId}) => {
    const 
        fieldTypeName = useAppSelector(state => taskCustomFieldTypesSelector.selectById(state,props.fieldtypeid).typeName)

    return (
        <Grid 
            component='li'
            pl={2}
            container
            direction='row'
            {...props}
            wrap='nowrap'
        >
            <Typography sx={{textOverflow:'ellipsis',overflow: 'hidden', whiteSpace: 'nowrap'}}>{fieldTypeName}</Typography>
        </Grid>
    )
}

export default AutocompleteCustomFieldTypeOption