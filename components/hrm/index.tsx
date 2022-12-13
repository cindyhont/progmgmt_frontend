import React, { memo, SyntheticEvent, useState } from "react";
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Departments from "./dept";
import Staff from "./staff";

const 
    HRMpanels = memo(() => {
        const
            numberOfTabs = 3,
            [tab,setTab] = useState(0),
            handleChange = (_: SyntheticEvent, newValue: number) => setTab(newValue)

        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Tabs 
                        value={tab}
                        variant="scrollable"
                        scrollButtons="auto"
                        onChange={handleChange}
                    >
                        <Tab label='View / Edit Users' />
                        <Tab label='Import New Users' />
                        <Tab label='View / Edit Departments' />
                    </Tabs>
                    <Grid 
                        container 
                        mt={2}
                    >
                        <Sections {...{numberOfTabs,tab}} />
                    </Grid>
                </Grid>
            </Grid>
        )
    }),
    Sections = memo(({numberOfTabs,tab}:{numberOfTabs:number;tab:number;})=>(
        <>
        {Array.from(Array(numberOfTabs).keys(),index=>(
            <Box 
                key={index}
                sx={{
                    display:index===tab ? 'block' : 'none',
                    width:'100%',
                    ...(index===0 && {overflowX:'scroll'})
                }}
            >
                {index === 0 && <Staff />}
                {index === 1 && <div style={{backgroundColor:'purple'}}>abcde</div>}
                {index === 2 && <Departments />}
            </Box>
        ))}
        </>
    ))

HRMpanels.displayName = 'HRMpanels'
Sections.displayName = 'Sections'
export default HRMpanels