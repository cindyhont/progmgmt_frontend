import { ReduxState, useAppSelector } from '@reducers'
import { createSelector, EntityId } from '@reduxjs/toolkit'
import React, { memo, SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { createEditRightSelector } from '.'
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material'
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import { useStore } from 'react-redux'
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import SimpleTextDisplay from './simple-text-display'
import { taskFieldSelector, taskSelector } from '@components/tasks/reducers/slice';
import { useTaskUpdateOneFieldMutation } from '@components/tasks/reducers/api';
import { useRouter } from 'next/router';

export interface Itag {
    id:EntityId;
    name:string;
    color:string;
}

const
    Tags = memo(({fieldID}:{fieldID:EntityId})=>{
        const
            router = useRouter(),
            taskID = router.query.taskid as string,
            editRightSelector = useMemo(()=>createEditRightSelector(fieldID,taskID),[fieldID,taskID])    ,
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            tagsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID)[fieldID] as EntityId[],
                (state:ReduxState)=>taskFieldSelector.selectById(state,fieldID).details.options as Itag[],
                (values:EntityId[],options:Itag[])=>options.filter(e=>values.includes(e.id))
            ),[fieldID,taskID]),
            tags = useAppSelector(state => tagsSelector(state)),
            [editMode,setEditMode] = useState(false),
            editOnClick = () => setEditMode(true),
            editModeOff = useCallback(()=>setEditMode(false),[])

        return (
            <Stack direction='column' px={1.5} pb={2} pt={0.5} spacing={editMode ? 2 : 0}>
                {!editMode && <>
                <Grid container direction='row'>
                    {tags.length===0 && <SimpleTextDisplay {...{content:'No tag',nilTextColor:true}} />}
                    {tags.length !== 0 && tags.map(({id,name,color})=>(<Tag key={id} {...{name,color}} />))}
                </Grid>
                {hasEditRight && <Button 
                    fullWidth 
                    variant='outlined' 
                    endIcon={<EditRoundedIcon />} 
                    sx={{fontSize:'0.8rem'}}
                    onClick={editOnClick}
                >Edit tags</Button>}
                </>}
                {editMode && <Editor {...{fieldID,editModeOff}} />}
            </Stack>
        )
    }),
    Tag = memo(({name,color}:{name:string;color:string;})=>{
        const theme = useTheme()
        return (
            <Chip 
                label={name} 
                sx={{
                    backgroundColor:color,
                    color:theme.palette.getContrastText(color),
                    mr:1,
                    mb:1
                }} 
                size='small'
            />
        )
    }),
    Editor = memo(({fieldID,editModeOff}:{fieldID:EntityId;editModeOff:()=>void;})=>{
        const
            theme = useTheme(),
            router = useRouter(),
            taskID = router.query.taskid as string,
            options = useAppSelector(state => taskFieldSelector.selectById(state,fieldID).details.options as Itag[]),
            [value,setValue] = useState<Itag[]>([]),
            onChange = (_:SyntheticEvent,v:Itag[]) => setValue([...v]),
            [updateField] = useTaskUpdateOneFieldMutation(),
            store = useStore(),
            onSubmit = () => {
                updateField({
                    id:taskID,
                    field:fieldID,
                    value:value.map(({id})=>id)
                })
                editModeOff()
            }

        useEffect(()=>{
            const 
                state = store.getState() as ReduxState,
                selectedIDs = taskSelector.selectById(state,taskID)[fieldID] as EntityId[]
            setValue(options.filter(e=>selectedIDs.includes(e.id)))
        },[taskID,fieldID])

        return (
            <>
            <Autocomplete 
                multiple
                options={options}
                value={value}
                onChange={onChange}
                forcePopupIcon={false}
                disableClearable
                filterSelectedOptions
                getOptionLabel={(opt:Itag)=>opt.name}
                renderInput={params=>(<TextField {...params} />)}
                renderTags={(tagValue, getTagProps) => tagValue.map(({name,color},index)=>(
                    <Chip 
                        label={name}
                        {...getTagProps({ index })}
                        sx={{
                            backgroundColor:color,
                            '.MuiChip-label':{
                                color:theme.palette.getContrastText(color)
                            }
                        }}
                        key={index}
                    />
                ))}
            />
            <Grid container direction='row' sx={{justifyContent:'space-between'}}>
                <Button variant='outlined' onClick={editModeOff}>Cancel</Button>
                <Button variant='contained' onClick={onSubmit}>OK</Button>
            </Grid>
            </>
        )
    })
Tags.displayName = 'Tags'
Tag.displayName = 'Tag'
Editor.displayName = 'Editor'
export default Tags