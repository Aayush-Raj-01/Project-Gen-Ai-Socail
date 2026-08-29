lines = open(r'C:/Users/Rashmalai/.cache/huggingface/modules/transformers_modules/microsoft/Florence_hyphen_2_hyphen_base/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/modeling_florence2.py', 'r', encoding='utf-8').readlines()
for target in [1791, 1873, 2197, 2817]:
    for i in range(target-1, -1, -1):
        line = lines[i].strip()
        if line.startswith('class ') and '(' in line:
            print(f'Line {target} is in: {line}')
            break
    for i in range(target-1, -1, -1):
        line = lines[i].strip()
        if line.startswith('def '):
            print(f'  Function: {line}')
            break
