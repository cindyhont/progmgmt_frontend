import Box from '@mui/material/Box';
import { Editor } from '@tinymce/tinymce-react';
import { ChangeEvent } from 'react';

const 
    file_picker_callback = (cb:Function) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.addEventListener('change', (e:any) => {
            const file = (e as ChangeEvent<HTMLInputElement>).target.files[0];
            cb(URL.createObjectURL(file))
        },{passive:true});

        input.click();
    },
    WysiwygPreload = () => (
        <Box style={{width:0,height:0,position:'fixed',bottom:'100vh',right:'100vw',opacity:'0'}}>
            <Editor 
                tinymceScriptSrc={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/tinymce/tinymce.min.js`}
                init={{
                    content_css:false,
                    statusbar: false,
                    menubar:false,
                    plugins:`autolink lists table link image code emoticons`,
                    toolbar:`emoticons | bold italic underline strikethrough | bullist numlist table | link image | code`,
                    contextmenu:'autolink lists table link image code emoticons',
                    file_picker_types:'image',
                    file_picker_callback,
                    extended_valid_elements:'span[data-userid|class]',
                    link_default_target:'_blank',
                }}
            />
        </Box>
    )

export default WysiwygPreload