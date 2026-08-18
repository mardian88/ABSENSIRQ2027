const fs = require('fs');

function fixDuplicates(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Using regex to remove the FIRST instance of saveMultiAngleData block
    // We will match the first saveMultiAngleData up to the next saveMultiAngleData
    const blockRegex = /const saveMultiAngleData = async \([^]*?const saveMultiAngleData = async/g;
    
    if (content.match(/const saveMultiAngleData = async/g)?.length > 1) {
        content = content.replace(/const saveMultiAngleData = async \([\s\S]*?(?=const saveMultiAngleData = async)/, '');
        fs.writeFileSync(file, content);
        console.log("Fixed duplicates in", file);
    }
}

fixDuplicates('src/app/santri/RegisterWajahModal.tsx');
fixDuplicates('src/app/admin-guru/RegisterWajahGuruModal.tsx');
