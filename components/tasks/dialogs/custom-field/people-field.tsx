import React, { ChangeEvent, HTMLAttributes, memo, useContext, useEffect, useRef, useState } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete, { AutocompleteRenderGetTagProps } from '@mui/material/Autocomplete';
import { useAppSelector } from "@reducers";
import { useSearchUserMutation } from "@reducers/user-details/api";
import { AutocompleteUserOption } from "@components/common-components";
import { userDetailsSelector } from "@reducers/user-details/slice";
import Avatar from "@mui/material/Avatar";
import Chip from '@mui/material/Chip';
import { Context } from ".";
import { editDefaultValueAction } from "./reducer";
import { EntityId } from "@reduxjs/toolkit";

export interface ItagProps {
    key: number;
    className: string;
    disabled: boolean;
    'data-tag-index': number;
    tabIndex: -1;
    onDelete: (event: any) => void;
}

const
    PeopleField = memo((
        {
            value,
            fieldTypeID
        }:{
            value:string[]
            fieldTypeID:EntityId;
        }
    )=>{
        const 
            [options,setOptions] = useState<string[]>([]),
            {customFieldDispatch} = useContext(Context),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:any//string[]
            ) => {
                e.preventDefault()
                customFieldDispatch(editDefaultValueAction({key:fieldTypeID,value:v}))
            },
            [searchUser] = useSearchUserMutation(),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (v.trim()==='') {
                    setOptions([])
                    return
                }

                try {
                    const result = await searchUser({query:v,exclude:value}).unwrap()

                    setOptions([...result])
                } catch (error) {
                    console.log(error)
                }
            },
            ref = useRef<HTMLInputElement>()

        useEffect(()=>{
            ref.current.focus()
        },[])

        return (
            <Autocomplete
                multiple
                options={options}
                value={value}
                filterSelectedOptions
                filterOptions={(options) => options}
                forcePopupIcon={false}
                onChange={onChange}
                onInputChange={onInputChange}
                renderInput={(params) => (<TextField {...params} inputRef={ref} label='Default persons' />)}
                renderTags={(ids:string[],getTagProps: AutocompleteRenderGetTagProps)=>(<Chips {...{ids,getTagProps}} />)}
                renderOption={(prop:HTMLAttributes<HTMLLIElement>,opt:string)=>{return !!opt ? <AutocompleteUserOption {...{...prop,uid:opt}} /> : <></>}}
            />
        )
    }),
    Chips = memo((
        {
            ids,
            getTagProps,
        }:{
            ids:string[];
            getTagProps: AutocompleteRenderGetTagProps
        }
    ) => (
        <>
        {ids.map((id,index)=>(<TaskChip key={id} {...{id,tagProps:getTagProps({index})}} />))}
        </>
    )),
    TaskChip = memo((
        {
            id,
            tagProps,
        }:{
            id:string;
            tagProps:ItagProps;
        }
    )=>{
        const 
            firstName = useAppSelector(state => userDetailsSelector.selectById(state,id).firstName),
            lastName = useAppSelector(state => userDetailsSelector.selectById(state,id).lastName),
            avatar = useAppSelector(state => userDetailsSelector.selectById(state,id).avatar)

        return (
            <Chip 
                avatar={<Avatar src={avatar} />}
                label={`${firstName} ${lastName}`.trim()} 
                {...tagProps} 
            />
        )
    })

PeopleField.displayName = 'PeopleField'
Chips.displayName = 'Chips'
TaskChip.displayName = 'TaskChip'
export default PeopleField